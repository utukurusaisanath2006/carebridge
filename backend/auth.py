"""
auth.py - Authentication, JWT Token Management, and Role-Based Access Control (RBAC).
Provides:
1. SQLite-backed user storage with bcrypt password hashing
2. JWT access & refresh token issuance and validation
3. Rate limiting and temporary lockout after 5 failed login attempts
4. FastAPI dependency injections: get_current_user, require_roles
5. Synthetic demo accounts seeded automatically (admin, operator, caregiver)
"""

import os
import sqlite3
import time
import re
import json
import uuid
from datetime import datetime, timezone, timedelta, date
from typing import Optional, List, Dict, Any, Literal
import bcrypt
import jwt
from fastapi import HTTPException, status, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from models import (
    PatientRegistrationRequest,
    PatientProfile,
    PatientUpdateRequest,
    PatientConsents,
    CaregiverInfo
)

# Secret from environment; never hardcoded
JWT_SECRET = os.environ.get("JWT_SECRET", "dischargeai_secure_jwt_secret_dev_demo_2026_key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 10

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "dischargeai.db")

http_bearer_scheme = HTTPBearer(auto_error=False)


# --- Models ---

class User(BaseModel):
    id: str
    username: str
    name: str
    role: Literal["ADMIN", "OPERATOR", "VIEWER", "PATIENT"]
    language_preference: str = "en"
    active: bool = True
    last_login: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: Optional[bool] = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    expires_in: int


# --- Database Initialization & Migrations ---

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db():
    conn = get_db()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                language_preference TEXT DEFAULT 'en',
                active INTEGER DEFAULT 1,
                last_login TEXT,
                failed_login_attempts INTEGER DEFAULT 0,
                lockout_until TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                mobile TEXT NOT NULL,
                email TEXT,
                dob TEXT NOT NULL,
                sex TEXT NOT NULL,
                uhid TEXT NOT NULL,
                hospital_name TEXT,
                discharge_date TEXT NOT NULL,
                diagnosis TEXT,
                allergies TEXT,
                conditions TEXT,
                medicines TEXT,
                height TEXT,
                weight TEXT,
                preferred_language TEXT DEFAULT 'en',
                caregiver_name TEXT,
                caregiver_mobile TEXT,
                caregiver_relationship TEXT,
                caregiver_consent_alerts INTEGER DEFAULT 0,
                reminder_times TEXT,
                notification_sound INTEGER DEFAULT 1,
                notification_browser INTEGER DEFAULT 1,
                notification_sms INTEGER DEFAULT 0,
                emergency_contact TEXT,
                consent_ai_disclaimer INTEGER DEFAULT 0,
                consent_data_processing INTEGER DEFAULT 0,
                consent_demo_notice INTEGER DEFAULT 0,
                consent_caregiver_alerts INTEGER DEFAULT 0,
                consents_accepted_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS auth_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                username TEXT NOT NULL,
                event_type TEXT NOT NULL,
                ip_address TEXT,
                details TEXT
            )
        """)
    conn.close()
    seed_demo_users()
    seed_demo_patients()


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def seed_demo_users():
    conn = get_db()
    cursor = conn.cursor()

    demo_accounts = [
        ("user-admin-1", "admin", "Administrator Sharma", "Admin@123", "ADMIN", "en"),
        ("user-operator-1", "operator", "Nurse Joy (RN)", "Operator@123", "OPERATOR", "en"),
        ("user-caregiver-1", "caregiver", "Sunita Kumar (Caregiver)", "Caregiver@123", "VIEWER", "en")
    ]

    for uid, username, name, password, role, lang in demo_accounts:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            hashed = hash_password(password)
            cursor.execute("""
                INSERT INTO users (id, username, name, password_hash, role, language_preference, active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (uid, username, name, hashed, role, lang))
    conn.commit()
    conn.close()


def seed_demo_patients():
    conn = get_db()
    cursor = conn.cursor()

    demo_patients = [
        {
            "user_id": "user-patient-ramesh",
            "patient_id": "patient-ramesh-01",
            "username": "ramesh",
            "password": "Patient@123",
            "full_name": "Ramesh Kumar",
            "mobile": "+919876543210",
            "email": "ramesh.kumar@example.com",
            "dob": "1968-05-14",
            "sex": "Male",
            "uhid": "UHID-98231",
            "hospital_name": "Apollo Hospital, Chennai",
            "discharge_date": "2026-10-08",
            "diagnosis": "Type 2 Diabetes with Hypertension",
            "allergies": json.dumps(["Sulfa"]),
            "conditions": json.dumps(["Diabetes", "Hypertension"]),
            "medicines": "Metformin 500mg, Amlodipine 5mg",
            "height": "172 cm",
            "weight": "74 kg",
            "preferred_language": "en",
            "caregiver_name": "Sunita Kumar",
            "caregiver_mobile": "+919876543211",
            "caregiver_relationship": "Spouse",
            "caregiver_consent_alerts": 1,
            "reminder_times": json.dumps({
                "morning": "08:00",
                "afternoon": "13:00",
                "evening": "18:00",
                "night": "21:00"
            })
        },
        {
            "user_id": "user-patient-sunitha",
            "patient_id": "patient-sunitha-02",
            "username": "sunitha",
            "password": "Patient@123",
            "full_name": "Sunitha Kmare",
            "mobile": "+919845012345",
            "email": "sunitha.kmare@example.com",
            "dob": "1982-11-20",
            "sex": "Female",
            "uhid": "UHID-74125",
            "hospital_name": "Fortis Hospital, Bengaluru",
            "discharge_date": "2026-10-08",
            "diagnosis": "Post-Operative Cholecystectomy with Mild Hypertension",
            "allergies": json.dumps(["Aspirin", "Penicillin"]),
            "conditions": json.dumps(["Hypertension"]),
            "medicines": "Amlodipine 5mg",
            "height": "160 cm",
            "weight": "62 kg",
            "preferred_language": "en",
            "caregiver_name": "Karthik Kmare",
            "caregiver_mobile": "+919845098765",
            "caregiver_relationship": "Brother",
            "caregiver_consent_alerts": 1,
            "reminder_times": json.dumps({
                "morning": "08:00",
                "afternoon": "13:00",
                "evening": "18:00",
                "night": "21:00"
            })
        }
    ]

    now_iso = datetime.now(timezone.utc).isoformat()

    for p in demo_patients:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (p["username"],))
        user_row = cursor.fetchone()
        if not user_row:
            hashed = hash_password(p["password"])
            cursor.execute("""
                INSERT INTO users (id, username, name, password_hash, role, language_preference, active)
                VALUES (?, ?, ?, ?, 'PATIENT', ?, 1)
            """, (p["user_id"], p["username"], p["full_name"], hashed, p["preferred_language"]))

        # Check if patient row exists
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (p["user_id"],))
        pat_row = cursor.fetchone()
        if not pat_row:
            cursor.execute("""
                INSERT INTO patients (
                    id, user_id, full_name, mobile, email, dob, sex, uhid,
                    hospital_name, discharge_date, diagnosis, allergies, conditions,
                    medicines, height, weight, preferred_language, caregiver_name,
                    caregiver_mobile, caregiver_relationship, caregiver_consent_alerts,
                    reminder_times, notification_sound, notification_browser, notification_sms,
                    emergency_contact, consent_ai_disclaimer, consent_data_processing,
                    consent_demo_notice, consent_caregiver_alerts, consents_accepted_at, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, 1, 1, 0,
                    ?, 1, 1,
                    1, ?, ?, ?
                )
            """, (
                p["patient_id"], p["user_id"], p["full_name"], p["mobile"], p["email"],
                p["dob"], p["sex"], p["uhid"], p["hospital_name"], p["discharge_date"],
                p["diagnosis"], p["allergies"], p["conditions"], p["medicines"],
                p["height"], p["weight"], p["preferred_language"], p["caregiver_name"],
                p["caregiver_mobile"], p["caregiver_relationship"], p["caregiver_consent_alerts"],
                p["reminder_times"], p.get("emergency_contact", ""),
                p["caregiver_consent_alerts"], now_iso, now_iso
            ))

    conn.commit()
    conn.close()


def log_auth_event(username: str, event_type: str, ip: str = None, details: str = None):
    try:
        conn = get_db()
        with conn:
            conn.execute("""
                INSERT INTO auth_logs (timestamp, username, event_type, ip_address, details)
                VALUES (?, ?, ?, ?, ?)
            """, (datetime.now(timezone.utc).isoformat(), username, event_type, ip or "127.0.0.1", details or ""))
        conn.close()
    except Exception as e:
        print(f"[Auth Log Error]: {e}")


# --- JWT Helpers ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": now, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )


# --- Dependencies ---

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer_scheme)
) -> User:
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    elif "token" in request.query_params:
        # Useful for Server-Sent Events (SSE EventSource does not support custom headers natively)
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role, language_preference, active, last_login FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or no longer exists."
        )

    return User(
        id=row["id"],
        username=row["username"],
        name=row["name"],
        role=row["role"],
        language_preference=row["language_preference"],
        active=bool(row["active"]),
        last_login=row["last_login"]
    )


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer_scheme)
) -> Optional[User]:
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {current_user.role}"
            )
        return current_user
    return role_checker


# --- Authentication Logic ---

def authenticate_user(login_data: LoginRequest, ip: str = "127.0.0.1") -> Dict[str, Any]:
    username = login_data.username.strip().lower()
    conn = get_db()
    cursor = conn.cursor()
    username_clean = username.strip().lower()
    clean_digits = re.sub(r"[^\d]", "", username)
    formatted_mobile = f"+91{clean_digits[-10:]}" if len(clean_digits) >= 10 else username
    mobile_10 = clean_digits[-10:] if len(clean_digits) >= 10 else username

    cursor.execute("""
        SELECT id, username, name, password_hash, role, language_preference, active,
               failed_login_attempts, lockout_until
        FROM users
        WHERE LOWER(username) = ?
           OR id IN (
               SELECT user_id FROM patients
               WHERE mobile = ? OR mobile = ? OR mobile = ? OR (email IS NOT NULL AND LOWER(email) = ?)
           )
    """, (username_clean, username, formatted_mobile, mobile_10, username_clean))
    row = cursor.fetchone()

    now = datetime.now(timezone.utc)

    if not row:
        log_auth_event(username, "LOGIN_FAILED", ip, "User not found")
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )

    # Check for active lockout
    lockout_until = row["lockout_until"]
    if lockout_until:
        try:
            lockout_time = datetime.fromisoformat(lockout_until)
            if lockout_time > now:
                remaining_secs = int((lockout_time - now).total_seconds())
                remaining_mins = max(1, remaining_secs // 60)
                conn.close()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account temporarily locked due to too many failed attempts. Try again in {remaining_mins} minutes."
                )
        except (ValueError, TypeError):
            pass

    # Verify password
    if not verify_password(login_data.password, row["password_hash"]):
        failed_attempts = (row["failed_login_attempts"] or 0) + 1
        new_lockout = None
        if failed_attempts >= MAX_FAILED_ATTEMPTS:
            lockout_target = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            new_lockout = lockout_target.isoformat()
            log_auth_event(username, "ACCOUNT_LOCKED", ip, f"Locked after {failed_attempts} failed attempts")
        else:
            log_auth_event(username, "LOGIN_FAILED", ip, f"Attempt {failed_attempts} of {MAX_FAILED_ATTEMPTS}")

        cursor.execute("""
            UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?
        """, (failed_attempts, new_lockout, row["id"]))
        conn.commit()
        conn.close()

        if new_lockout:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to 5 failed attempts. Please wait {LOCKOUT_DURATION_MINUTES} minutes."
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )

    # Success: reset failed attempts & update last login
    now_iso = now.isoformat()
    cursor.execute("""
        UPDATE users
        SET failed_login_attempts = 0, lockout_until = NULL, last_login = ?
        WHERE id = ?
    """, (now_iso, row["id"]))
    conn.commit()
    conn.close()

    log_auth_event(username, "LOGIN_SUCCESS", ip, f"Role: {row['role']}")

    user = User(
        id=row["id"],
        username=row["username"],
        name=row["name"],
        role=row["role"],
        language_preference=row["language_preference"],
        active=bool(row["active"]),
        last_login=now_iso
    )

    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role, "name": user.name}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "username": user.username}
    )

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ==========================================
# PATIENT REGISTRATION & PROFILE MANAGEMENT
# ==========================================

def mask_mobile(mobile: str) -> str:
    cleaned = re.sub(r"[^\d]", "", str(mobile or ""))
    if len(cleaned) < 4:
        return "******"
    return "*" * max(6, len(cleaned) - 4) + cleaned[-4:]


def calculate_age(dob_str: str) -> Optional[int]:
    try:
        d = date.fromisoformat(dob_str[:10])
        today = date.today()
        return today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    except Exception:
        return None


def row_to_patient_profile(row: sqlite3.Row) -> PatientProfile:
    try:
        allergies = json.loads(row["allergies"]) if row["allergies"] else []
    except Exception:
        allergies = [a.strip() for a in str(row["allergies"] or "").split(",") if a.strip()]

    try:
        conditions = json.loads(row["conditions"]) if row["conditions"] else []
    except Exception:
        conditions = [c.strip() for c in str(row["conditions"] or "").split(",") if c.strip()]

    try:
        reminder_times = json.loads(row["reminder_times"]) if row["reminder_times"] else {}
    except Exception:
        reminder_times = {
            "morning": "08:00",
            "afternoon": "13:00",
            "evening": "18:00",
            "night": "21:00"
        }

    caregiver = CaregiverInfo(
        name=row["caregiver_name"] or "",
        mobile=row["caregiver_mobile"] or "",
        relationship=row["caregiver_relationship"] or "",
        consent_alerts=bool(row["caregiver_consent_alerts"])
    )

    consents = PatientConsents(
        ai_disclaimer=bool(row["consent_ai_disclaimer"]),
        data_processing=bool(row["consent_data_processing"]),
        demo_notice=bool(row["consent_demo_notice"]),
        caregiver_alerts=bool(row["consent_caregiver_alerts"]),
        accepted_at=row["consents_accepted_at"]
    )

    return PatientProfile(
        id=row["id"],
        user_id=row["user_id"],
        full_name=row["full_name"],
        mobile=row["mobile"],
        masked_mobile=mask_mobile(row["mobile"]),
        email=row["email"] or None,
        dob=row["dob"],
        age=calculate_age(row["dob"]),
        sex=row["sex"],
        uhid=row["uhid"],
        hospital_name=row["hospital_name"] or "Care Facility",
        discharge_date=row["discharge_date"],
        diagnosis=row["diagnosis"] or None,
        allergies=allergies,
        conditions=conditions,
        medicines=row["medicines"] or None,
        height=row["height"] or None,
        weight=row["weight"] or None,
        preferred_language=row["preferred_language"] or "en",
        caregiver=caregiver,
        reminder_times=reminder_times,
        notification_sound=bool(row["notification_sound"]),
        notification_browser=bool(row["notification_browser"]),
        notification_sms=bool(row["notification_sms"]),
        emergency_contact=row["emergency_contact"] or None,
        consents=consents,
        created_at=row["created_at"]
    )


def register_patient_user(reg: PatientRegistrationRequest, ip: str = "127.0.0.1") -> Dict[str, Any]:
    # 1. Validate full name
    name_clean = reg.full_name.strip()
    if len(name_clean) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required (minimum 2 characters)."
        )

    # 2. Validate Indian mobile phone number (10 digits, optional +91)
    clean_digits = re.sub(r"[^\d]", "", reg.mobile)
    if len(clean_digits) == 12 and clean_digits.startswith("91"):
        mobile_10 = clean_digits[2:]
    elif len(clean_digits) == 10:
        mobile_10 = clean_digits
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be a valid 10-digit Indian number (+91)."
        )
    formatted_mobile = f"+91{mobile_10}"

    # 3. Validate optional email
    email_clean = reg.email.strip().lower() if reg.email and reg.email.strip() else None
    if email_clean and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # 4. Validate password strength (min 8 chars, 1 letter, 1 number)
    pwd = reg.password
    if len(pwd) < 8 or not re.search(r"[A-Za-z]", pwd) or not re.search(r"\d", pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one letter and one number."
        )

    # 5. Validate Date of Birth (fallback to 1975-01-01 if not provided)
    dob_raw = reg.dob or getattr(reg, "date_of_birth", None) or "1975-01-01"
    try:
        dob_d = date.fromisoformat(dob_raw[:10])
        if dob_d > date.today():
            dob_d = date(1975, 1, 1)
    except Exception:
        dob_d = date(1975, 1, 1)
    dob_str = dob_d.isoformat()

    # 6. Validate Discharge Date (default to today if omitted)
    disch_raw = reg.discharge_date or date.today().isoformat()
    try:
        disch_d = date.fromisoformat(disch_raw[:10])
    except Exception:
        disch_d = date.today()
    discharge_date_str = disch_d.isoformat()

    # 7. Validate UHID / Admission number (generate default if empty)
    uhid_clean = (reg.uhid or "").strip()
    if not uhid_clean:
        uhid_clean = f"UHID-{uuid.uuid4().hex[:6].upper()}"

    # 8. Check for duplicate mobile or email
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id FROM patients
        WHERE mobile = ? OR mobile = ? OR (email IS NOT NULL AND email != '' AND LOWER(email) = ?)
    """, (formatted_mobile, mobile_10, email_clean or ""))
    dup_pat = cursor.fetchone()
    if dup_pat:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this mobile number or email already exists. Please sign in instead."
        )

    # 9. Determine username: use provided username if available, else mobile
    if reg.username and reg.username.strip():
        chosen_username = reg.username.strip()
        cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?", (chosen_username.lower(),))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{chosen_username}' is already taken. Please choose another username."
            )
        username_candidate = chosen_username
    else:
        username_candidate = f"patient_{mobile_10}"
        cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?", (username_candidate.lower(),))
        if cursor.fetchone():
            username_candidate = f"patient_{mobile_10}_{uuid.uuid4().hex[:4]}"

    # 10. Create user and patient records
    now_iso = datetime.now(timezone.utc).isoformat()
    new_user_id = f"user-patient-{uuid.uuid4().hex[:8]}"
    new_patient_id = f"patient-{uuid.uuid4().hex[:8]}"
    hashed_pwd = hash_password(pwd)

    cursor.execute("""
        INSERT INTO users (id, username, name, password_hash, role, language_preference, active, last_login)
        VALUES (?, ?, ?, ?, 'PATIENT', ?, 1, ?)
    """, (new_user_id, username_candidate, name_clean, hashed_pwd, reg.preferred_language, now_iso))

    cursor.execute("""
        INSERT INTO patients (
            id, user_id, full_name, mobile, email, dob, sex, uhid,
            hospital_name, discharge_date, diagnosis, allergies, conditions,
            medicines, height, weight, preferred_language, caregiver_name,
            caregiver_mobile, caregiver_relationship, caregiver_consent_alerts,
            reminder_times, notification_sound, notification_browser, notification_sms,
            emergency_contact, consent_ai_disclaimer, consent_data_processing,
            consent_demo_notice, consent_caregiver_alerts, consents_accepted_at, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, 1, 1,
            1, ?, ?, ?
        )
    """, (
        new_patient_id, new_user_id, name_clean, formatted_mobile, email_clean,
        dob_str, reg.sex or "Other", uhid_clean, reg.hospital_name or "Care Facility",
        discharge_date_str, reg.diagnosis or "", json.dumps(reg.allergies or []),
        json.dumps(reg.conditions or getattr(reg, "chronic_conditions", None) or []),
        (reg.medicines if isinstance(reg.medicines, str) else ", ".join(reg.current_medicines or [])) or "",
        reg.height or "", reg.weight or "", reg.preferred_language or "en",
        reg.caregiver.name if reg.caregiver else "",
        reg.caregiver.mobile if reg.caregiver else "",
        reg.caregiver.relationship if reg.caregiver else "",
        1 if (reg.caregiver and reg.caregiver.consent_alerts) else 0,
        json.dumps(reg.reminder_times or {}), 1 if reg.notification_sound else 0,
        1 if reg.notification_browser else 0, 1 if reg.notification_sms else 0,
        reg.emergency_contact or "", 1 if (reg.consents and reg.consents.caregiver_alerts) else 0,
        now_iso, now_iso
    ))

    conn.commit()

    # Retrieve patient profile
    cursor.execute("SELECT * FROM patients WHERE id = ?", (new_patient_id,))
    pat_row = cursor.fetchone()
    conn.close()

    patient_profile = row_to_patient_profile(pat_row)

    # Log registration event (with masked mobile for privacy)
    log_auth_event(
        username_candidate,
        "PATIENT_REGISTERED",
        ip=ip,
        details=f"Patient {new_patient_id} registered ({mask_mobile(formatted_mobile)})"
    )

    # Generate session tokens
    user = User(
        id=new_user_id,
        username=username_candidate,
        name=name_clean,
        role="PATIENT",
        language_preference=reg.preferred_language,
        active=True,
        last_login=now_iso
    )

    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role, "name": user.name}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "username": user.username}
    )

    return {
        "user": user,
        "patient": patient_profile,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


def get_patient_by_user_id(user_id: str) -> Optional[PatientProfile]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return row_to_patient_profile(row)


def get_patient_by_id(patient_id: str) -> Optional[PatientProfile]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ? OR user_id = ?", (patient_id, patient_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return row_to_patient_profile(row)


def get_all_patients(query: Optional[str] = None) -> List[PatientProfile]:
    conn = get_db()
    cursor = conn.cursor()
    if query and query.strip():
        q = f"%{query.strip().lower()}%"
        cursor.execute("""
            SELECT * FROM patients
            WHERE LOWER(full_name) LIKE ? OR LOWER(uhid) LIKE ? OR mobile LIKE ?
            ORDER BY created_at DESC
        """, (q, q, q))
    else:
        cursor.execute("SELECT * FROM patients ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_patient_profile(r) for r in rows]


def update_patient_profile(user_id: str, update: PatientUpdateRequest) -> PatientProfile:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient profile not found")

    updates = []
    params = []

    if update.full_name is not None:
        updates.append("full_name = ?")
        params.append(update.full_name.strip())
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (update.full_name.strip(), user_id))

    if update.mobile is not None:
        clean_digits = re.sub(r"[^\d]", "", update.mobile)
        if len(clean_digits) == 12 and clean_digits.startswith("91"):
            clean_digits = clean_digits[2:]
        formatted_mobile = f"+91{clean_digits}"
        updates.append("mobile = ?")
        params.append(formatted_mobile)

    if update.email is not None:
        updates.append("email = ?")
        params.append(update.email.strip().lower() if update.email else None)

    if update.dob is not None:
        updates.append("dob = ?")
        params.append(update.dob[:10])

    if update.sex is not None:
        updates.append("sex = ?")
        params.append(update.sex)

    if update.uhid is not None:
        updates.append("uhid = ?")
        params.append(update.uhid.strip())

    if update.hospital_name is not None:
        updates.append("hospital_name = ?")
        params.append(update.hospital_name.strip())

    if update.discharge_date is not None:
        updates.append("discharge_date = ?")
        params.append(update.discharge_date[:10])

    if update.diagnosis is not None:
        updates.append("diagnosis = ?")
        params.append(update.diagnosis)

    if update.allergies is not None:
        updates.append("allergies = ?")
        params.append(json.dumps(update.allergies))

    if update.conditions is not None:
        updates.append("conditions = ?")
        params.append(json.dumps(update.conditions))

    if update.medicines is not None:
        updates.append("medicines = ?")
        params.append(update.medicines)

    if update.height is not None:
        updates.append("height = ?")
        params.append(update.height)

    if update.weight is not None:
        updates.append("weight = ?")
        params.append(update.weight)

    if update.preferred_language is not None:
        updates.append("preferred_language = ?")
        params.append(update.preferred_language)
        cursor.execute("UPDATE users SET language_preference = ? WHERE id = ?", (update.preferred_language, user_id))

    if update.caregiver is not None:
        updates.append("caregiver_name = ?")
        params.append(update.caregiver.name)
        updates.append("caregiver_mobile = ?")
        params.append(update.caregiver.mobile)
        updates.append("caregiver_relationship = ?")
        params.append(update.caregiver.relationship)
        updates.append("caregiver_consent_alerts = ?")
        params.append(1 if update.caregiver.consent_alerts else 0)

    if update.reminder_times is not None:
        updates.append("reminder_times = ?")
        params.append(json.dumps(update.reminder_times))

    if update.notification_sound is not None:
        updates.append("notification_sound = ?")
        params.append(1 if update.notification_sound else 0)

    if update.notification_browser is not None:
        updates.append("notification_browser = ?")
        params.append(1 if update.notification_browser else 0)

    if update.notification_sms is not None:
        updates.append("notification_sms = ?")
        params.append(1 if update.notification_sms else 0)

    if update.emergency_contact is not None:
        updates.append("emergency_contact = ?")
        params.append(update.emergency_contact)

    if updates:
        sql = f"UPDATE patients SET {', '.join(updates)} WHERE user_id = ?"
        params.append(user_id)
        cursor.execute(sql, params)
        conn.commit()

    cursor.execute("SELECT * FROM patients WHERE user_id = ?", (user_id,))
    updated_row = cursor.fetchone()
    conn.close()

    log_auth_event(user_id, "PATIENT_PROFILE_UPDATED", details="Profile details modified")
    return row_to_patient_profile(updated_row)


def delete_patient_user(user_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        return False

    username = user_row["username"]
    cursor.execute("DELETE FROM patients WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    log_auth_event(username, "PATIENT_DELETED", details="User exercised Delete My Data")
    return True
