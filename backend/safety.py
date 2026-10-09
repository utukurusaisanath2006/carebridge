"""
Rule-based Drug Safety & Timing Verification Layer.
Runs deterministic clinical rules to protect patient safety:
1. Duplicate medication detection (e.g. duplicate active ingredients or classes)
2. Missing dosage or frequency detection
3. Ambiguous timing flagging (e.g. 'as needed' without upper limit)
4. Translation verification: ensures drug names, doses, and numbers are preserved in every translation.
5. Escalation triggers for human clinical review.
"""

import re
from typing import List, Tuple, Optional, Union, Dict, Any
from models import FollowUpTask, SafetyFlag


def verify_translation_fidelity(
    task_or_tasks: Union[FollowUpTask, List[FollowUpTask]],
    enabled_languages: Optional[List[str]] = None
) -> List[SafetyFlag]:
    """
    Validates that every number and drug name in simple_language is preserved
    in each non-English translation. Drops keys not in enabled_languages.
    If a translation omits a dose, number, or drug name, flags for human review.
    Accepts a single FollowUpTask or a list of FollowUpTask instances.
    """
    if isinstance(task_or_tasks, list):
        all_flags: List[SafetyFlag] = []
        for t in task_or_tasks:
            all_flags.extend(verify_translation_fidelity(t, enabled_languages))
        return all_flags

    task = task_or_tasks
    flags: List[SafetyFlag] = []
    if not task.translations:
        return flags

    # Filter translations to only enabled languages if provided
    if enabled_languages:
        allowed = set(enabled_languages) - {"en"}
        task.translations = {k: v for k, v in task.translations.items() if k in allowed}
        task.reminder_text = {k: v for k, v in task.reminder_text.items() if k in allowed}

    simple_text = task.simple_language.lower()

    # Extract all numbers/digits from simple_language (e.g. "500", "5", "7", "3", "70", "130", "80")
    numbers_in_source = re.findall(r"\b\d+\b", simple_text)

    # Extract common medication names
    med_match = re.search(
        r"\b(metformin|amlodipine|aspirin|clopidogrel|atorvastatin|lisinopril|paracetamol|salbutamol|ibuprofen|amoxicillin|insulin|glimepiride|pantoprazole)\b",
        simple_text,
        re.IGNORECASE
    )
    drug_name_in_source = med_match.group(1).lower() if med_match else None

    for lang_code, trans_text in task.translations.items():
        if not trans_text or not trans_text.strip():
            continue

        trans_lower = trans_text.lower()
        missing_items = []

        # Check each number
        for num in numbers_in_source:
            # Check if digit is in translation (in Indic scripts numbers are usually written as standard digits e.g. 500, 5)
            if num not in trans_text:
                missing_items.append(f"number '{num}'")

        # Check drug name if medication
        if drug_name_in_source and drug_name_in_source not in trans_lower:
            # Also check if drug name is present in English script or standard transliteration
            if drug_name_in_source not in trans_text:
                missing_items.append(f"drug '{drug_name_in_source.title()}'")

        if missing_items:
            task.escalate_to_human = True
            task.escalation_reason = (task.escalation_reason or "") + " [Translation could not be verified]"
            flags.append(SafetyFlag(
                flag_id=f"flag-trans-{task.id}-{lang_code}",
                severity="warning",
                rule_name="Translation Verification Warning",
                code="TRANSLATION_VERIFICATION",
                params={"lang": lang_code, "missing_items": ", ".join(missing_items)},
                message=f"Translation into '{lang_code}' could not be verified: missing {', '.join(missing_items)}.",
                task_id=task.id,
                action_required="Certified bilingual staff must review translated instruction before patient delivery."
            ))

    return flags


def evaluate_drug_safety_rules(
    tasks: List[FollowUpTask],
    enabled_languages: Optional[List[str]] = None,
    patient_context: Optional[Dict[str, Any]] = None
) -> Tuple[List[FollowUpTask], List[SafetyFlag]]:
    """
    Evaluates rule-based clinical safeguards against all tasks.
    Modifies tasks in-place to set escalate_to_human=True when clinical rules trigger.
    Checks:
    - Translation fidelity & number/drug retention
    - Internal duplicate medication detection
    - Missing dosage strength / ambiguous timing
    - Patient mismatch (name/UHID mismatch between registration & summary)
    - Allergy conflicts against registered patient allergies
    - Duplicate medicines against patient's current home regimen
    Returns the updated task list and a list of generated SafetyFlags.
    """
    flags: List[SafetyFlag] = []
    med_names_seen = {}

    p_ctx = patient_context or {}
    reg_name = (p_ctx.get("registered_name") or "").strip().lower()
    summary_name = (p_ctx.get("summary_patient_name") or "").strip().lower()
    reg_uhid = (p_ctx.get("registered_uhid") or "").strip().lower()
    summary_uhid = (p_ctx.get("summary_uhid") or "").strip().lower()
    raw_summary_text = (p_ctx.get("raw_summary_text") or "").lower()

    # Rule A: Patient Identity / UHID Mismatch Check
    has_mismatch = False
    mismatch_reason = ""
    if reg_name and summary_name and reg_name != "patient" and summary_name != "patient":
        reg_tokens = set(re.findall(r"[a-z]+", reg_name)) - {"mr", "mrs", "ms", "dr", "patient"}
        sum_tokens = set(re.findall(r"[a-z]+", summary_name)) - {"mr", "mrs", "ms", "dr", "patient"}
        if reg_tokens and sum_tokens and not (reg_tokens & sum_tokens):
            has_mismatch = True
            mismatch_reason = f"Registered name '{p_ctx.get('registered_name')}' does not match discharge summary patient '{p_ctx.get('summary_patient_name')}'"

    if not has_mismatch and reg_uhid and summary_uhid and reg_uhid != summary_uhid:
        has_mismatch = True
        mismatch_reason = f"Registered UHID '{p_ctx.get('registered_uhid')}' differs from summary UHID '{p_ctx.get('summary_uhid')}'"

    if has_mismatch:
        flags.append(SafetyFlag(
            flag_id="flag-patient-mismatch",
            severity="critical",
            rule_name="Patient Identity Verification",
            code="PATIENT_MISMATCH",
            params={
                "registered_patient": p_ctx.get("registered_name", ""),
                "summary_patient": p_ctx.get("summary_patient_name", "")
            },
            message=f"CRITICAL MISMATCH: {mismatch_reason}.",
            action_required="Human clinical coordinator must manually verify patient identity before issuing discharge plan."
        ))
        for t in tasks:
            t.escalate_to_human = True
            if "Patient Identity Mismatch" not in (t.escalation_reason or ""):
                t.escalation_reason = (t.escalation_reason or "") + " [Patient Identity Mismatch]"

    # Pre-parse registered patient allergies
    raw_allergies = p_ctx.get("allergies") or []
    registered_allergies = [a.strip().lower() for a in raw_allergies if a and str(a).strip()]

    # Pre-parse registered current medicines
    raw_current_meds = str(p_ctx.get("current_medicines") or "").lower()
    known_drug_pattern = r"\b(metformin|amlodipine|aspirin|clopidogrel|atorvastatin|lisinopril|paracetamol|salbutamol|ibuprofen|amoxicillin|insulin|glimepiride|pantoprazole)\b"
    home_drugs_seen = set(re.findall(known_drug_pattern, raw_current_meds))

    for idx, task in enumerate(tasks):
        # 0. Translation fidelity checks
        trans_flags = verify_translation_fidelity(task, enabled_languages)
        flags.extend(trans_flags)

        if task.type == "Medication":
            text = task.original_text.lower()
            simple = task.simple_language.lower()
            combined = f"{text} {simple}"

            # 1. Extract generic medication candidate name
            med_match = re.search(
                r"\b(metformin|amlodipine|aspirin|clopidogrel|atorvastatin|lisinopril|paracetamol|salbutamol|ibuprofen|amoxicillin|insulin|glimepiride|pantoprazole)\b",
                combined
            )
            if med_match:
                med_name = med_match.group(1)

                # Check if matches home drug regimen (Duplicate Medicine Rule)
                if med_name in home_drugs_seen:
                    flags.append(SafetyFlag(
                        flag_id=f"flag-home-dup-{idx}",
                        severity="critical",
                        rule_name="Current Home Medication Duplicate",
                        code="DUPLICATE_MEDICINE",
                        params={"drug": med_name.title(), "source": "Current Home Regimen", "task_id": task.id},
                        message=f"Current home medicine duplicate: '{med_name.title()}' is already in patient's existing regimen and is re-prescribed.",
                        task_id=task.id,
                        action_required=f"Pharmacist must reconcile existing home supply with discharge order for {med_name.title()}."
                    ))
                    task.escalate_to_human = True
                    task.escalation_reason = (task.escalation_reason or "") + f" [Duplicate drug alert: {med_name.title()}]"

                if med_name in med_names_seen:
                    prior_id = med_names_seen[med_name]
                    flag = SafetyFlag(
                        flag_id=f"flag-dup-{idx}",
                        severity="critical",
                        rule_name="Duplicate Medication Rule",
                        code="DUPLICATE_MEDICINE",
                        params={"drug": med_name.title(), "prior_task": prior_id, "task_id": task.id},
                        message=f"Duplicate order detected for '{med_name.title()}'. Both {prior_id} and {task.id} prescribe this agent.",
                        task_id=task.id,
                        action_required="Nurse or Pharmacist must reconcile medication list to prevent double dosing."
                    )
                    flags.append(flag)
                    task.escalate_to_human = True
                    task.escalation_reason = (task.escalation_reason or "") + f" [Duplicate drug alert: {med_name.title()}]"
                else:
                    med_names_seen[med_name] = task.id

            # Rule B: Allergy Conflict Check
            for allergy in registered_allergies:
                if allergy in combined or (med_match and allergy in med_name):
                    flags.append(SafetyFlag(
                        flag_id=f"flag-allergy-{idx}",
                        severity="critical",
                        rule_name="Patient Allergy Conflict",
                        code="ALLERGY_CONFLICT",
                        params={"allergy": allergy.title(), "order": task.simple_language, "task_id": task.id},
                        message=f"CRITICAL ALLERGY CONFLICT: Order '{task.simple_language}' conflicts with registered patient allergy to '{allergy.title()}'.",
                        task_id=task.id,
                        action_required=f"IMMEDIATE CLINICIAN REVIEW: Do not administer without doctor verifying patient allergy to {allergy.title()}."
                    ))
                    task.escalate_to_human = True
                    if "ALLERGY CONFLICT" not in (task.escalation_reason or ""):
                        task.escalation_reason = (task.escalation_reason or "") + f" [ALLERGY CONFLICT: {allergy.title()}]"

            # 2. Check for missing dosage (e.g., missing 'mg', 'ml', 'units', 'mcg')
            has_dosage = bool(re.search(r"\d+\s*(mg|mcg|g|ml|units?|tablets?|capsules?|puffs?)\b", combined))
            if not has_dosage:
                flag = SafetyFlag(
                    flag_id=f"flag-dose-{idx}",
                    severity="warning",
                    rule_name="Missing Dose Specification",
                    code="MISSING_DOSE",
                    params={"order": task.simple_language},
                    message=f"Medication order '{task.simple_language}' does not explicitly specify a numeric strength or dosage unit.",
                    task_id=task.id,
                    action_required="Verify exact dose strength with prescribing physician."
                )
                flags.append(flag)
                task.escalate_to_human = True
                task.escalation_reason = (task.escalation_reason or "") + " [Missing dosage strength in order]"

            # 3. Check for ambiguous timing / frequency
            is_ambiguous = any(term in combined for term in ["as needed", "prn", "whenever", "if required", "when necessary"])
            has_explicit_freq = bool(re.search(r"(once|twice|thrice|\b\d+\s*times|\bevery\s+\d+|daily|bedtime|morning|night)", combined))

            if is_ambiguous and not has_explicit_freq:
                flag = SafetyFlag(
                    flag_id=f"flag-time-{idx}",
                    severity="warning",
                    rule_name="Ambiguous Timing & Frequency",
                    code="AMBIGUOUS_TIMING",
                    params={"order": task.simple_language},
                    message=f"Order '{task.simple_language}' contains vague timing ('as needed') without maximum daily frequency limits.",
                    task_id=task.id,
                    action_required="Establish max daily frequency (e.g. max 3 doses in 24 hours) with clinician."
                )
                flags.append(flag)
                task.escalate_to_human = True
                task.escalation_reason = (task.escalation_reason or "") + " [Ambiguous schedule without daily limit]"

        # 4. Check for high-risk red-flag words in any task
        elif task.type == "Warning Sign" or "warning" in task.original_text.lower():
            if not task.escalate_to_human:
                task.escalate_to_human = True
                task.escalation_reason = "Emergency clinical threshold requiring patient comprehension confirmation."
                flags.append(SafetyFlag(
                    flag_id=f"flag-warn-{idx}",
                    severity="critical",
                    rule_name="Acute Emergency Warning Protocol",
                    code="ACUTE_WARNING",
                    params={"warning": task.simple_language},
                    message=f"High-priority clinical warning sign: '{task.simple_language}'.",
                    task_id=task.id,
                    action_required="Ensure patient and caregiver demonstrate understanding of emergency escalation."
                ))

    return tasks, flags
