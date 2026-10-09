"""
Pydantic data models for DischargeAI.
Strictly preserves the original specification while supporting dynamic,
operator-controlled multilingual translations (translations and reminder_text),
settings persistence, drug safety flags, and clinical audit entries.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, model_validator


class SettingsModel(BaseModel):
    default_language: str = "en"
    enabled_languages: List[str] = Field(default_factory=lambda: ["en"])
    ui_language: str = "en"
    read_aloud_language: str = "en"
    notification_sound: bool = True
    notification_browser_push: bool = True
    notification_severities: List[str] = Field(default_factory=lambda: ["critical", "warning", "info"])
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"


class UpdateSettingsRequest(BaseModel):
    default_language: Optional[str] = "en"
    enabled_languages: List[str]
    ui_language: Optional[str] = "en"
    read_aloud_language: Optional[str] = "en"
    notification_sound: Optional[bool] = None
    notification_browser_push: Optional[bool] = None
    notification_severities: Optional[List[str]] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    actor: Optional[str] = "Hospital Operator"


class SafetyFlag(BaseModel):
    flag_id: str
    severity: Literal["critical", "warning", "info"] = "warning"
    rule_name: str
    message: str
    code: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    task_id: Optional[str] = None
    action_required: str


class AuditEntry(BaseModel):
    timestamp: str
    actor: str  # e.g., "Nurse Joy (RN)", "AI Agent Pipeline", "Dr. Priya Sharma", "Hospital Operator"
    action: str  # e.g., "Status updated to Completed", "Language settings updated"
    code: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    task_id: Optional[str] = None
    details: Optional[str] = None


class FollowUpTask(BaseModel):
    id: str
    type: Literal[
        "Appointment",
        "Medication",
        "Test",
        "Referral",
        "Diet",
        "Wound Care",
        "Warning Sign",
        "Other"
    ]
    original_text: str
    simple_language: str

    # Language-agnostic dictionary mapping language codes to translated text
    # e.g. {"hi": "भोजन के बाद...", "ta": "..."}
    translations: Dict[str, str] = Field(default_factory=dict)
    reminder_text: Dict[str, str] = Field(default_factory=dict)

    # Backward compatibility fields (adapted from/to translations dict)
    hindi_translation: Optional[str] = None
    tamil_translation: Optional[str] = None

    due_date: Optional[str] = None
    provider_or_facility: Optional[str] = None
    status: Literal["Pending", "Completed", "Needs Review", "Skipped", "Snoozed"] = "Pending"
    escalate_to_human: bool = False
    escalation_reason: Optional[str] = None
    escalation_reason_translations: Dict[str, str] = Field(default_factory=dict)
    source_line: str

    # Structured scheduling fields (derived strictly from explicit instructions)
    frequency_per_day: Optional[int] = None
    times_of_day: Optional[List[str]] = Field(default_factory=list)  # e.g. ["08:00", "20:00"]
    meal_relation: Optional[Literal["before", "after", "with", "none"]] = "none"
    duration_days: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    dose_amount: Optional[str] = None  # e.g. "500mg"

    @model_validator(mode="after")
    def sync_legacy_translations(self):
        # Sync legacy hindi_translation into translations["hi"] and vice versa
        if self.hindi_translation and "hi" not in self.translations:
            self.translations["hi"] = self.hindi_translation
        elif "hi" in self.translations and not self.hindi_translation:
            self.hindi_translation = self.translations["hi"]

        # Sync legacy tamil_translation into translations["ta"] and vice versa
        if self.tamil_translation and "ta" not in self.translations:
            self.translations["ta"] = self.tamil_translation
        elif "ta" in self.translations and not self.tamil_translation:
            self.tamil_translation = self.translations["ta"]

        return self


class FollowUpPlan(BaseModel):
    patient_name: str
    discharge_date: str
    hospital_name: str
    overall_summary: str
    urgent_warnings: List[str] = Field(default_factory=list)
    follow_up_tasks: List[FollowUpTask] = Field(default_factory=list)
    confidence_note: str

    # Dynamic Multilingual Plan Translations
    overall_summary_translations: Dict[str, str] = Field(default_factory=dict)
    urgent_warnings_translations: Dict[str, List[str]] = Field(default_factory=dict)
    confidence_note_translations: Dict[str, str] = Field(default_factory=dict)

    # Extended attributes for hospital dashboard & safety
    is_fallback: bool = False
    ai_model: str = "claude-sonnet-4-6"
    diagnosis: Optional[str] = None
    patient_age_gender: Optional[str] = None
    safety_flags: List[SafetyFlag] = Field(default_factory=list)
    audit_log: List[AuditEntry] = Field(default_factory=list)
    created_at: Optional[str] = None
    enabled_languages: List[str] = Field(default_factory=lambda: ["en"])


class AdherenceLogEntry(BaseModel):
    task_id: str
    action: Literal["Taken", "Snooze", "Skip", "Missed"]
    scheduled_time: Optional[str] = None
    timestamp: Optional[str] = None
    patient_name: Optional[str] = None
    note: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    task_id: str
    status: Optional[str] = None
    times_of_day: Optional[List[str]] = None
    reviewed_by: Optional[str] = "Clinical Reviewer"
    review_notes: Optional[str] = None


class TranslatePlanRequest(BaseModel):
    plan_id: Optional[str] = None
    plan: Optional[Dict[str, Any]] = None
    languages: List[str]  # e.g. ["ta", "te"]


# ==========================================
# PATIENT REGISTRATION & PROFILE MODELS
# ==========================================

class CaregiverInfo(BaseModel):
    name: str = ""
    mobile: str = ""
    relationship: Optional[str] = None
    consent_alerts: bool = False


class PatientConsents(BaseModel):
    ai_disclaimer: bool = True
    data_processing: bool = True
    demo_notice: bool = True
    caregiver_alerts: bool = False
    accepted_at: Optional[str] = None


class PatientRegistrationRequest(BaseModel):
    # Step 1: Account
    username: Optional[str] = None
    full_name: str
    mobile: str
    email: Optional[str] = None
    password: str
    preferred_language: str = "en"
    otp: Optional[str] = None

    # Step 2: Clinical & Medical Demographics
    dob: Optional[str] = "1975-01-01"
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = "Other"
    uhid: Optional[str] = None
    discharge_date: Optional[str] = None
    hospital_name: Optional[str] = "Care Facility"
    diagnosis: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    medicines: Optional[str] = None
    current_medicines: Optional[List[str]] = None
    height: Optional[str] = None
    weight: Optional[str] = None

    # Step 3: Caregiver, Notifications & Consents
    caregiver: Optional[CaregiverInfo] = None
    reminder_times: Dict[str, str] = Field(default_factory=lambda: {
        "morning": "08:00",
        "afternoon": "13:00",
        "evening": "18:00",
        "night": "21:00"
    })
    notification_sound: bool = True
    notification_browser: bool = True
    notification_sms: bool = False
    emergency_contact: Optional[str] = None
    consents: Optional[PatientConsents] = None


class PatientProfile(BaseModel):
    id: str
    user_id: str
    full_name: str
    mobile: str
    masked_mobile: str
    email: Optional[str] = None
    dob: str
    age: Optional[int] = None
    sex: str
    uhid: str
    hospital_name: Optional[str] = None
    discharge_date: str
    diagnosis: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    medicines: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    preferred_language: str = "en"
    caregiver: CaregiverInfo
    reminder_times: Dict[str, str] = Field(default_factory=dict)
    notification_sound: bool = True
    notification_browser: bool = True
    notification_sms: bool = False
    emergency_contact: Optional[str] = None
    consents: PatientConsents
    created_at: str


class PatientUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[str] = None
    uhid: Optional[str] = None
    hospital_name: Optional[str] = None
    discharge_date: Optional[str] = None
    diagnosis: Optional[str] = None
    allergies: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    medicines: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    preferred_language: Optional[str] = None
    caregiver: Optional[CaregiverInfo] = None
    reminder_times: Optional[Dict[str, str]] = None
    notification_sound: Optional[bool] = None
    notification_browser: Optional[bool] = None
    notification_sms: Optional[bool] = None
    emergency_contact: Optional[str] = None


class PatientContext(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    current_medicines: Optional[str] = None
    registered_name: Optional[str] = None
    registered_uhid: Optional[str] = None
    preferred_language: Optional[str] = None
