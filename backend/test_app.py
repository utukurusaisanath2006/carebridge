"""
Unit & Integration Tests for DischargeAI Backend.
Covers schema validation, drug safety rule engine, timing parser,
API endpoints, and mocked AI pipeline.
"""

import pytest
from models import FollowUpPlan, FollowUpTask, SafetyFlag, AuditEntry
from safety import evaluate_drug_safety_rules
from timing import parse_schedule_from_text
from sample_data import SAMPLE_DIABETES_SUMMARY, SAMPLE_DIABETES_PLAN
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    from auth import init_auth_db, create_access_token
    from notifications import init_notifications_db
    init_auth_db()
    init_notifications_db()
    c = TestClient(app)
    # Default header with operator token so operator endpoints pass
    token = create_access_token({"sub": "user-operator-1", "username": "operator", "role": "OPERATOR", "name": "Nurse Joy (RN)"})
    c.headers.update({"Authorization": f"Bearer {token}"})
    return c



def test_schema_validation_valid():
    task = FollowUpTask(
        id="t-1",
        type="Medication",
        original_text="Take Metformin 500mg twice daily",
        simple_language="Take Metformin 500mg twice a day with meals.",
        hindi_translation="दिन में दो बार मेटफॉर्मिन 500mg लें।",
        tamil_translation="மெட்ஃபோர்மின் 500 மிகி தினமும் இரண்டு முறை எடுத்துக்கொள்ளவும்.",
        due_date="Daily",
        status="Pending",
        escalate_to_human=False,
        source_line="Take Metformin 500mg twice daily",
        frequency_per_day=2,
        times_of_day=["08:00", "20:00"],
        meal_relation="after"
    )

    plan = FollowUpPlan(
        patient_name="Ramesh Kumar",
        discharge_date="08-Oct-2026",
        hospital_name="Apollo Hospital",
        overall_summary="Plain summary here.",
        urgent_warnings=["Hypoglycemia alert"],
        follow_up_tasks=[task],
        confidence_note="High confidence note."
    )

    assert plan.patient_name == "Ramesh Kumar"
    assert len(plan.follow_up_tasks) == 1
    assert plan.follow_up_tasks[0].times_of_day == ["08:00", "20:00"]
    assert plan.follow_up_tasks[0].tamil_translation is not None


def test_timing_parser_explicit():
    # 1. Twice daily after meals
    res1 = parse_schedule_from_text("Take Metformin 500mg twice daily after meals")
    assert res1["frequency_per_day"] == 2
    assert res1["times_of_day"] == ["08:00", "20:00"]
    assert res1["meal_relation"] == "after"
    assert res1["is_ambiguous"] is False

    # 2. Once daily in morning
    res2 = parse_schedule_from_text("Take Amlodipine 5mg once daily in the morning")
    assert res2["frequency_per_day"] == 1
    assert res2["times_of_day"] == ["08:00"]

    # 3. Duration days
    res3 = parse_schedule_from_text("Clean IV site daily for 3 days")
    assert res3["duration_days"] == 3

    # 4. Ambiguous PRN timing
    res4 = parse_schedule_from_text("Take Paracetamol as needed for severe headache")
    assert res4["is_ambiguous"] is True


def test_drug_safety_rules_duplicate_detection():
    task1 = FollowUpTask(
        id="t-med-1",
        type="Medication",
        original_text="Take Metformin 500mg twice daily",
        simple_language="Take Metformin 500mg morning and night",
        source_line="Take Metformin 500mg twice daily"
    )
    task2 = FollowUpTask(
        id="t-med-2",
        type="Medication",
        original_text="Continue Metformin 850mg once daily",
        simple_language="Take Metformin 850mg at lunch",
        source_line="Continue Metformin 850mg once daily"
    )

    updated_tasks, flags = evaluate_drug_safety_rules([task1, task2])
    dup_flags = [f for f in flags if f.rule_name == "Duplicate Medication Rule"]
    assert len(dup_flags) >= 1
    assert task2.escalate_to_human is True


def test_drug_safety_rules_missing_dose():
    task_no_dose = FollowUpTask(
        id="t-med-3",
        type="Medication",
        original_text="Take Amlodipine daily",
        simple_language="Take Amlodipine every day",
        source_line="Take Amlodipine daily"
    )

    _, flags = evaluate_drug_safety_rules([task_no_dose])
    dose_flags = [f for f in flags if f.rule_name == "Missing Dose Specification"]
    assert len(dose_flags) >= 1
    assert task_no_dose.escalate_to_human is True


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_sample_endpoint(client):
    response = client.get("/api/sample?type=diabetes")
    assert response.status_code == 200
    data = response.json()
    assert "Ramesh Kumar" in data["patient_identifier"]
    assert "Metformin" in data["discharge_text"]


def test_analyze_endpoint_fallback(client):
    response = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "force_refresh": True}
    )
    assert response.status_code == 200
    plan = response.json()
    assert plan["patient_name"].startswith("Ramesh")
    assert len(plan["follow_up_tasks"]) >= 7
    # Verify timing slots exist
    med_tasks = [t for t in plan["follow_up_tasks"] if t["type"] == "Medication"]
    assert len(med_tasks) >= 2
    assert med_tasks[0]["times_of_day"] is not None


def test_settings_endpoints(client):
    # 1. Get settings
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "default_language" in data
    assert "supported_languages" in data
    assert any(lang["code"] == "hi" for lang in data["supported_languages"])

    # 2. Update settings with valid extra languages (up to 3)
    update_res = client.put(
        "/api/settings",
        json={"enabled_languages": ["en", "hi", "ta"], "ui_language": "hi"}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()["settings"]
    assert "hi" in updated_data["enabled_languages"]
    assert "ta" in updated_data["enabled_languages"]

    # 3. Reject invalid language code
    bad_code_res = client.put(
        "/api/settings",
        json={"enabled_languages": ["en", "invalid-code"]}
    )
    assert bad_code_res.status_code == 400

    # 4. Reject more than 3 extra languages
    too_many_res = client.put(
        "/api/settings",
        json={"enabled_languages": ["en", "hi", "ta", "te", "kn"]}
    )
    assert too_many_res.status_code == 400


def test_settings_persistence_and_analyze_filtering(client):
    from settings_manager import load_settings

    # PUT ["en", "hi"]
    put_res = client.put(
        "/api/settings",
        json={"enabled_languages": ["en", "hi"], "ui_language": "hi"}
    )
    assert put_res.status_code == 200
    assert put_res.json()["settings"]["enabled_languages"] == ["en", "hi"]
    assert "supported_languages" in put_res.json()

    # GET must return exactly ["en", "hi"]
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    assert get_res.json()["settings"]["enabled_languages"] == ["en", "hi"]

    # Direct file reload must match (survives restart)
    disk_settings = load_settings()
    assert disk_settings.enabled_languages == ["en", "hi"]

    # When analyze is called without languages field, it must use the saved enabled_languages
    analyze_res = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "force_refresh": True}
    )
    assert analyze_res.status_code == 200
    plan_data = analyze_res.json()
    assert plan_data["enabled_languages"] == ["en", "hi"]
    for task in plan_data["follow_up_tasks"]:
        assert "ta" not in task["translations"]
        if task.get("translations"):
            assert set(task["translations"].keys()).issubset({"hi"})

    # Reset to English-only
    client.put("/api/settings", json={"enabled_languages": ["en"]})


def test_dynamic_prompt_english_only():
    from agent import build_dynamic_user_prompt
    prompt_en = build_dynamic_user_prompt("Take Metformin 500mg daily", ["en"])
    assert "translations" not in prompt_en
    assert "hindi_translation" not in prompt_en
    assert "Translate" not in prompt_en

    prompt_multi = build_dynamic_user_prompt("Take Metformin 500mg daily", ["en", "hi", "ta"])
    assert "translations" in prompt_multi
    assert "Hindi" in prompt_multi
    assert "Tamil" in prompt_multi


def test_translation_fidelity_safety():
    from safety import verify_translation_fidelity
    # Task with number '500' in simple_language
    task = FollowUpTask(
        id="t-fidelity-1",
        type="Medication",
        original_text="Take Metformin 500mg daily",
        simple_language="Take Metformin 500mg once a day with water",
        source_line="Take Metformin 500mg daily",
        translations={"hi": "पानी के साथ दिन में एक बार मेटफॉर्मिन लें"},  # Missing 500!
        reminder_text={},
        status="Pending",
        escalate_to_human=False
    )
    verify_translation_fidelity([task], ["hi"])
    assert task.escalate_to_human is True
    assert "Translation could not be verified" in task.escalation_reason


def test_translate_existing_plan_endpoint(client):
    # First, run an analysis in English only
    client.put("/api/settings", json={"enabled_languages": ["en"], "ui_language": "en"})
    res = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "languages": ["en"], "force_refresh": True}
    )
    assert res.status_code == 200
    plan = res.json()
    orig_task_ids = [t["id"] for t in plan["follow_up_tasks"]]

    # Now translate existing plan to Tamil without re-extracting
    trans_res = client.post(
        "/api/translate-plan",
        json={"languages": ["ta"], "plan": plan}
    )
    assert trans_res.status_code == 200
    trans_data = trans_res.json()
    assert "ta" in trans_data["plan"]["enabled_languages"]
    # Check that task IDs, statuses, and times were NOT altered
    new_task_ids = [t["id"] for t in trans_data["plan"]["follow_up_tasks"]]
    assert new_task_ids == orig_task_ids
    for t in trans_data["plan"]["follow_up_tasks"]:
        assert "ta" in t["translations"]


def test_seven_step_operator_language_workflow(client):
    """
    Verifies the end-to-end 7-step operator workflow:
    1. Fresh start: English-only.
    2. Add Hindi, Save -> PUT /api/settings persists ["en", "hi"].
    3. Analyze -> only English and Hindi generated.
    4. Add Tamil, Save -> translate-plan endpoint adds Tamil without re-extracting.
    5. Task IDs and clinical statuses stay intact.
    6. Remove Hindi, Save -> PUT /api/settings with ["en", "ta"].
    7. Disk persistence -> settings.json contains new values.
    """
    from settings_manager import load_settings

    # Step 1: English-only baseline
    res1 = client.put("/api/settings", json={"enabled_languages": ["en"]})
    assert res1.status_code == 200
    assert res1.json()["settings"]["enabled_languages"] == ["en"]

    # Step 2: Operator adds Hindi
    res2 = client.put("/api/settings", json={"enabled_languages": ["en", "hi"]})
    assert res2.status_code == 200
    assert res2.json()["settings"]["enabled_languages"] == ["en", "hi"]

    # Step 3: Analyze uses operator settings when no languages passed
    res3 = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "force_refresh": True}
    )
    assert res3.status_code == 200
    plan3 = res3.json()
    assert plan3["enabled_languages"] == ["en", "hi"]
    for task in plan3["follow_up_tasks"]:
        # Only Hindi allowed as extra translation
        assert set(task.get("translations", {}).keys()).issubset({"hi"})
        assert "ta" not in task.get("translations", {})

    # Step 4 & 5: Operator adds Tamil to existing plan via /api/translate-plan
    orig_ids = [t["id"] for t in plan3["follow_up_tasks"]]
    orig_statuses = [t["status"] for t in plan3["follow_up_tasks"]]

    res4 = client.post(
        "/api/translate-plan",
        json={"languages": ["ta"], "plan": plan3}
    )
    assert res4.status_code == 200
    plan4 = res4.json()["plan"]
    new_ids = [t["id"] for t in plan4["follow_up_tasks"]]
    new_statuses = [t["status"] for t in plan4["follow_up_tasks"]]
    assert new_ids == orig_ids
    assert new_statuses == orig_statuses
    for t in plan4["follow_up_tasks"]:
        assert "ta" in t["translations"]

    # Step 6: Operator removes Hindi
    res6 = client.put("/api/settings", json={"enabled_languages": ["en", "ta"]})
    assert res6.status_code == 200
    assert res6.json()["settings"]["enabled_languages"] == ["en", "ta"]

    # Step 7: Disk persistence verification
    disk_settings = load_settings()
    assert disk_settings.enabled_languages == ["en", "ta"]

    # Clean up to default English-only
    client.put("/api/settings", json={"enabled_languages": ["en"]})


def test_safety_flags_have_structured_codes_and_params():
    """Verifies that all safety rules generate machine-readable codes and interpolation params."""
    from safety import evaluate_drug_safety_rules

    tasks = [
        FollowUpTask(
            id="t-med-1",
            type="Medication",
            original_text="Take Metformin 500mg daily",
            simple_language="Take Metformin 500mg once daily",
            source_line="Take Metformin 500mg daily"
        ),
        FollowUpTask(
            id="t-med-2",
            type="Medication",
            original_text="Metformin 1000mg twice daily",
            simple_language="Take Metformin 1000mg twice daily",
            source_line="Metformin 1000mg twice daily"
        ),
        FollowUpTask(
            id="t-med-3",
            type="Medication",
            original_text="Take Aspirin as needed for pain",
            simple_language="Take Aspirin as needed for pain",
            source_line="Take Aspirin as needed for pain"
        ),
        FollowUpTask(
            id="t-warn-1",
            type="Warning Sign",
            original_text="Warning: Severe chest pain emergency",
            simple_language="Severe chest pain emergency",
            source_line="Warning: Severe chest pain emergency"
        )
    ]

    updated_tasks, flags = evaluate_drug_safety_rules(tasks)
    flag_codes = {f.code for f in flags if f.code}
    assert "DUPLICATE_MEDICINE" in flag_codes
    assert "MISSING_DOSE" in flag_codes
    assert "AMBIGUOUS_TIMING" in flag_codes
    assert "ACUTE_WARNING" in flag_codes

    # Check that params are populated
    dup_flag = next(f for f in flags if f.code == "DUPLICATE_MEDICINE")
    assert dup_flag.params.get("drug") == "Metformin"
    assert dup_flag.params.get("prior_task") == "t-med-1"
    assert dup_flag.params.get("task_id") == "t-med-2"


def test_plan_level_translations_in_translate_endpoint(client):
    """Verifies that translating a plan populates overall_summary, urgent_warnings, and confidence_note translations."""
    client.put("/api/settings", json={"enabled_languages": ["en"], "ui_language": "en"})
    res = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "languages": ["en"], "force_refresh": True}
    )
    assert res.status_code == 200
    plan = res.json()

    trans_res = client.post(
        "/api/translate-plan",
        json={"languages": ["hi"], "plan": plan}
    )
    assert trans_res.status_code == 200
    data = trans_res.json()
    assert "hi" in data["overall_summary_translations"]
    assert "hi" in data["urgent_warnings_translations"]
    assert "hi" in data["confidence_note_translations"]
    assert len(data["urgent_warnings_translations"]["hi"]) > 0

    # Verify audit entry code
    audit_codes = [a.get("code") for a in data["plan"]["audit_log"] if a.get("code")]
    assert "PLAN_TRANSLATED" in audit_codes


def test_auth_login_success_and_tokens(client):
    res = client.post(
        "/api/auth/login",
        json={"username": "operator", "password": "Operator@123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "OPERATOR"
    assert data["user"]["username"] == "operator"
    assert "access_token" in res.cookies


def test_auth_login_failure_invalid_credentials(client):
    res = client.post(
        "/api/auth/login",
        json={"username": "operator", "password": "WrongPassword999"}
    )
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]


def test_auth_lockout_after_five_failed_attempts(client):
    import sqlite3
    from auth import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE username = 'caregiver'")
    conn.commit()
    conn.close()

    # 4 failed attempts should yield 401
    for _ in range(4):
        res = client.post(
            "/api/auth/login",
            json={"username": "caregiver", "password": "WrongPassword"}
        )
        assert res.status_code == 401


    try:
        # 5th failed attempt should trigger 429
        res5 = client.post(
            "/api/auth/login",
            json={"username": "caregiver", "password": "WrongPassword"}
        )
        assert res5.status_code == 429
        assert "locked" in res5.json()["detail"].lower()
    finally:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE username = 'caregiver'")
        conn.commit()
        conn.close()


def test_password_hashes_are_not_plain_text():
    import sqlite3
    from auth import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash FROM users")
    rows = cursor.fetchall()
    conn.close()

    assert len(rows) >= 3
    for username, p_hash in rows:
        assert p_hash != "Admin@123"
        assert p_hash != "Operator@123"
        assert p_hash != "Caregiver@123"
        assert p_hash.startswith("$2b$") or p_hash.startswith("$2a$")


def test_role_enforcement_viewer_forbidden(client):
    from auth import create_access_token
    viewer_token = create_access_token({"sub": "user-caregiver-1", "username": "caregiver", "role": "VIEWER", "name": "Sunita Kumar"})
    
    # Viewer tries to update settings -> 403
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    res_settings = client.put(
        "/api/settings",
        json={"enabled_languages": ["en", "hi"]},
        headers=viewer_headers
    )
    assert res_settings.status_code == 403

    # Viewer tries to update task / review -> 403
    res_task = client.post(
        "/api/update-task",
        json={"task_id": "t-1", "status": "Completed"},
        headers=viewer_headers
    )
    assert res_task.status_code == 403


def test_unauthenticated_request_rejected(client):
    # Strip auth header
    unauth_res = client.get("/api/settings", headers={"Authorization": ""})
    assert unauth_res.status_code == 401


def test_notifications_emitted_and_persisted(client):
    # 1. Analyze creates notifications
    analyze_res = client.post(
        "/api/analyze",
        json={"discharge_text": SAMPLE_DIABETES_SUMMARY, "force_refresh": True}
    )
    assert analyze_res.status_code == 200

    notifs_res = client.get("/api/notifications")
    assert notifs_res.status_code == 200
    notifs_data = notifs_res.json()
    assert notifs_data["total"] > 0
    types = [n["type"] for n in notifs_data["items"]]
    assert "ESCALATION_CREATED" in types or "PLAN_READY" in types

    # 2. Missed dose adherence creates critical notification
    adh_res = client.post(
        "/api/adherence",
        json={"task_id": "t-1", "action": "Missed", "scheduled_time": "08:00"}
    )
    assert adh_res.status_code == 200

    notifs_res2 = client.get("/api/notifications?severity=critical")
    assert notifs_res2.status_code == 200
    crit_types = [n["type"] for n in notifs_res2.json()["items"]]
    assert "MISSED_DOSE" in crit_types or "ESCALATION_CREATED" in crit_types


def test_notification_read_and_acknowledge(client):
    # Get any notification
    notifs_res = client.get("/api/notifications")
    items = notifs_res.json()["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    # Mark read
    read_res = client.post(f"/api/notifications/{target_id}/read")
    assert read_res.status_code == 200
    assert read_res.json()["notification"]["read_at"] is not None

    # Acknowledge
    ack_res = client.post(f"/api/notifications/{target_id}/acknowledge")
    assert ack_res.status_code == 200
    assert "Nurse Joy" in ack_res.json()["notification"]["acknowledged_by"]






# ==========================================
# PATIENT REGISTRATION & SAFETY TESTS
# ==========================================

def test_patient_registration_success_and_tokens(client):
    import sqlite3
    from auth import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM patients WHERE email = 'pooja.verma@example.com' OR mobile = '+919811223344'")
    conn.execute("DELETE FROM users WHERE username LIKE 'patient_9811223344%'")
    conn.commit()
    conn.close()

    reg_payload = {
        "full_name": "Pooja Verma",
        "mobile": "+919811223344",
        "email": "pooja.verma@example.com",
        "password": "SecurePass123",
        "preferred_language": "hi",
        "dob": "1990-04-12",
        "sex": "Female",
        "uhid": "UHID-POOJA-01",
        "discharge_date": "2026-10-08",
        "hospital_name": "Apollo Hospital, Delhi",
        "diagnosis": "Mild Asthma Flare",
        "allergies": ["Sulfa"],
        "conditions": ["Asthma"],
        "medicines": "Salbutamol Inhaler",
        "height": "162 cm",
        "weight": "58 kg",
        "caregiver": {
            "name": "Rohan Verma",
            "mobile": "+919811223345",
            "relationship": "Spouse",
            "consent_alerts": True
        },
        "reminder_times": {
            "morning": "08:00",
            "afternoon": "13:00",
            "evening": "18:00",
            "night": "21:00"
        },
        "consents": {
            "ai_disclaimer": True,
            "data_processing": True,
            "demo_notice": True,
            "caregiver_alerts": True
        }
    }

    res = client.post("/api/auth/register-patient", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"
    assert data["patient"]["full_name"] == "Pooja Verma"
    assert data["patient"]["masked_mobile"].endswith("3344")
    assert "access_token" in res.cookies

    # Verify operator received NEW_PATIENT_REGISTERED notification
    notifs_res = client.get("/api/notifications")
    types = [n["type"] for n in notifs_res.json()["items"]]
    assert "NEW_PATIENT_REGISTERED" in types


def test_patient_registration_duplicate_rejected(client):
    # Ramesh Kumar's mobile is +919876543210 (seeded)
    dup_payload = {
        "full_name": "Another Ramesh",
        "mobile": "+919876543210",
        "email": "another@example.com",
        "password": "Password123",
        "preferred_language": "en",
        "dob": "1980-01-01",
        "sex": "Male",
        "uhid": "UHID-DUP-1",
        "discharge_date": "2026-10-08",
        "caregiver": {"name": "Test", "mobile": "+919876543211", "relationship": "Friend"},
        "consents": {"ai_disclaimer": True, "data_processing": True, "demo_notice": True}
    }
    res = client.post("/api/auth/register-patient", json=dup_payload)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"].lower()


def test_patient_registration_weak_password_rejected(client):
    weak_payload = {
        "full_name": "Test User",
        "mobile": "+919900112233",
        "password": "short",
        "preferred_language": "en",
        "dob": "1995-05-05",
        "sex": "Female",
        "uhid": "UHID-WEAK-1",
        "discharge_date": "2026-10-08",
        "caregiver": {"name": "Care", "mobile": "+919900112234"},
        "consents": {"ai_disclaimer": True, "data_processing": True, "demo_notice": True}
    }
    res = client.post("/api/auth/register-patient", json=weak_payload)
    assert res.status_code == 400
    assert "at least 8 characters" in res.json()["detail"]


def test_patient_registration_dob_and_discharge_date_validation(client):
    future_dob_payload = {
        "full_name": "Future Baby",
        "mobile": "+919911223344",
        "password": "ValidPass123",
        "preferred_language": "en",
        "dob": "2099-01-01",
        "sex": "Male",
        "uhid": "UHID-FUT-1",
        "discharge_date": "2026-10-08",
        "caregiver": {"name": "Parent", "mobile": "+919911223345"},
        "consents": {"ai_disclaimer": True, "data_processing": True, "demo_notice": True}
    }
    res = client.post("/api/auth/register-patient", json=future_dob_payload)
    assert res.status_code == 400
    assert "future" in res.json()["detail"].lower()


def test_patient_password_hashed_in_db():
    import sqlite3
    from auth import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE username = 'ramesh'")
    row = cursor.fetchone()
    conn.close()
    assert row is not None
    pwd_hash = row[0]
    assert pwd_hash.startswith("$2b$") or pwd_hash.startswith("$2a$")
    assert "Patient@123" not in pwd_hash


def test_patient_rbac_cannot_read_other_patients_or_operator_routes(client):
    # Log in as seeded patient Sunitha
    login_res = client.post(
        "/api/auth/login",
        json={"username": "sunitha", "password": "Patient@123"}
    )
    assert login_res.status_code == 200
    pat_token = login_res.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    # Patient can read their own profile
    me_res = client.get("/api/patients/me", headers=pat_headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Sunitha Kmare"

    # Patient CANNOT list all patients (403 Forbidden)
    all_res = client.get("/api/patients", headers=pat_headers)
    assert all_res.status_code == 403

    # Patient CANNOT update language settings (403 Forbidden)
    set_res = client.put("/api/settings", json={"enabled_languages": ["en"]}, headers=pat_headers)
    assert set_res.status_code == 403


def test_operator_can_list_and_search_patients(client):
    # Fixture client has operator token
    list_res = client.get("/api/patients")
    assert list_res.status_code == 200
    patients = list_res.json()
    assert len(patients) >= 2
    names = [p["full_name"] for p in patients]
    assert "Sunitha Kmare" in names
    assert "Ramesh Kumar" in names

    # Search filter
    search_res = client.get("/api/patients?q=Sunitha")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data) >= 1
    assert search_data[0]["full_name"] == "Sunitha Kmare"
    assert search_data[0]["masked_mobile"].startswith("******")


def test_patient_mismatch_detection_and_notification(client):
    # Analyzing a summary belonging to Ramesh Kumar with Sunitha's patient context triggers PATIENT_MISMATCH
    mismatch_context = {
        "registered_name": "Sunitha Kmare",
        "registered_uhid": "UHID-74125",
        "age": 44,
        "sex": "Female"
    }

    res = client.post(
        "/api/analyze",
        json={
            "discharge_text": "Patient: Ramesh Kumar, 58M\nDischarged from: Apollo Hospital, Chennai\nDate: 08-Oct-2026\n1. Take Metformin 500mg twice daily after meals.",
            "languages": ["en"],
            "patient_context": mismatch_context,
            "force_refresh": True
        }
    )
    assert res.status_code == 200
    plan = res.json()
    flag_codes = [f["code"] for f in plan.get("safety_flags", []) if f.get("code")]
    assert "PATIENT_MISMATCH" in flag_codes

    # Verify task escalated to human
    assert any(t["escalate_to_human"] for t in plan["follow_up_tasks"])

    # Verify operator notification created
    notifs_res = client.get("/api/notifications?severity=critical")
    types = [n["type"] for n in notifs_res.json()["items"]]
    assert "PATIENT_MISMATCH" in types


def test_allergy_conflict_detection_and_escalation(client):
    allergy_context = {
        "registered_name": "Sunitha Kmare",
        "allergies": ["Aspirin"],
        "age": 44,
        "sex": "Female"
    }

    res = client.post(
        "/api/analyze",
        json={
            "discharge_text": "Patient: Sunitha Kmare, 44F\nDate: 08-Oct-2026\n1. Take Aspirin 75mg once daily after breakfast.\n2. Follow-up in 10 days.",
            "languages": ["en"],
            "patient_context": allergy_context,
            "force_refresh": True
        }
    )
    assert res.status_code == 200
    plan = res.json()
    flag_codes = [f["code"] for f in plan.get("safety_flags", []) if f.get("code")]
    assert "ALLERGY_CONFLICT" in flag_codes
    # Aspirin task must have escalate_to_human=True
    aspirin_task = next((t for t in plan["follow_up_tasks"] if "aspirin" in t["original_text"].lower()), None)
    assert aspirin_task is not None
    assert aspirin_task["escalate_to_human"] is True
    assert "ALLERGY CONFLICT" in (aspirin_task["escalation_reason"] or "")


def test_sensitive_fields_absent_from_claude_prompt():
    from agent import build_dynamic_user_prompt
    context = {
        "registered_name": "Sunitha Kmare",
        "registered_uhid": "UHID-SECRET-999",
        "mobile": "+919845012345",
        "caregiver": {"name": "Karthik Kmare", "mobile": "+919845098765"},
        "age": 44,
        "sex": "Female",
        "allergies": ["Penicillin"],
        "conditions": ["Hypertension"],
        "current_medicines": "Amlodipine 5mg",
        "preferred_language": "hi"
    }

    prompt = build_dynamic_user_prompt("Discharge summary text here", ["en", "hi"], patient_context=context)
    # Sensitive identifiers must NEVER appear in the prompt
    assert "Sunitha Kmare" not in prompt
    assert "UHID-SECRET-999" not in prompt
    assert "+919845012345" not in prompt
    assert "Karthik Kmare" not in prompt
    # Medical demographics should appear for clinical safety
    assert "Age: 44" in prompt
    assert "Sex: Female" in prompt
    assert "Penicillin" in prompt
    assert "Amlodipine 5mg" in prompt


def test_delete_my_data_endpoint(client):
    # Register a temporary patient
    reg_res = client.post("/api/auth/register-patient", json={
        "full_name": "Temp Patient",
        "mobile": "+919700000001",
        "password": "TempPassword123",
        "dob": "1992-02-02",
        "sex": "Other",
        "uhid": "UHID-TEMP-01",
        "discharge_date": "2026-10-08",
        "caregiver": {"name": "Temp Care", "mobile": "+919700000002"},
        "consents": {"ai_disclaimer": True, "data_processing": True, "demo_notice": True}
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Delete data
    del_res = client.delete("/api/patients/me", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Account should no longer exist
    login_again = client.post("/api/auth/login", json={"username": "patient_9700000001", "password": "TempPassword123"})
    assert login_again.status_code == 401
