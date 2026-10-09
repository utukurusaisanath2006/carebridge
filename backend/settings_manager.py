"""
Settings Manager for DischargeAI.
Manages operator language configurations, persists settings to JSON,
and validates language constraints.
"""

import os
import json
from typing import Dict, Any, List
from models import SettingsModel
from languages import SUPPORTED_LANGUAGES, get_supported_languages_list, is_valid_language_code

SETTINGS_FILE_PATH = os.path.join(os.path.dirname(__file__), "data", "settings.json")

DEFAULT_SETTINGS = {
    "default_language": "en",
    "enabled_languages": ["en"],
    "ui_language": "en",
    "read_aloud_language": "en"
}


def load_settings() -> SettingsModel:
    """Loads settings from JSON file or returns defaults."""
    if os.path.exists(SETTINGS_FILE_PATH):
        try:
            with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return SettingsModel(**data)
        except Exception:
            pass
    return SettingsModel(**DEFAULT_SETTINGS)


def save_settings(settings: SettingsModel) -> SettingsModel:
    """Persists settings to JSON file."""
    os.makedirs(os.path.dirname(SETTINGS_FILE_PATH), exist_ok=True)
    with open(SETTINGS_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, ensure_ascii=False, indent=2)
    return settings


def get_settings_with_metadata() -> Dict[str, Any]:
    """Returns the current settings together with the full list of supported languages."""
    settings = load_settings()
    return {
        "settings": settings.model_dump(),
        "supported_languages": get_supported_languages_list(),
        **settings.model_dump()
    }


def get_enabled_language_codes() -> List[str]:
    """Returns the currently active enabled language codes."""
    return load_settings().enabled_languages


def validate_and_update_settings(
    req_or_langs: Any = None,
    default_language: str = "en",
    ui_language: str = "en",
    read_aloud_language: str = "en",
    **kwargs
) -> SettingsModel:
    """
    Validates:
    - 'en' is always present in enabled_languages.
    - All language codes are supported.
    - At most 3 additional languages (excluding 'en') are enabled.
    """
    if hasattr(req_or_langs, "enabled_languages"):
        langs = req_or_langs.enabled_languages
        def_lang = getattr(req_or_langs, "default_language", "en") or "en"
        ui_lang = getattr(req_or_langs, "ui_language", "en") or "en"
        read_lang = getattr(req_or_langs, "read_aloud_language", "en") or "en"
    elif isinstance(req_or_langs, list):
        langs = req_or_langs
        def_lang = default_language
        ui_lang = ui_language
        read_lang = read_aloud_language
    else:
        current = load_settings()
        langs = kwargs.get("enabled_languages", current.enabled_languages)
        def_lang = kwargs.get("default_language", current.default_language)
        ui_lang = kwargs.get("ui_language", current.ui_language)
        read_lang = kwargs.get("read_aloud_language", current.read_aloud_language)

    # Normalize
    langs = list(dict.fromkeys(langs))  # Deduplicate while preserving order

    if "en" not in langs:
        langs.insert(0, "en")

    # Validate all codes
    for code in langs:
        if not is_valid_language_code(code):
            raise ValueError(f"Unsupported language code '{code}'. Supported codes: {list(SUPPORTED_LANGUAGES.keys())}")

    extra_count = len([c for c in langs if c != "en"])
    if extra_count > 3:
        raise ValueError(f"Maximum 3 additional languages allowed. Received {extra_count}.")

    current = load_settings()

    notif_sound = getattr(req_or_langs, "notification_sound", None)
    if notif_sound is None:
        notif_sound = kwargs.get("notification_sound", current.notification_sound)

    notif_push = getattr(req_or_langs, "notification_browser_push", None)
    if notif_push is None:
        notif_push = kwargs.get("notification_browser_push", current.notification_browser_push)

    notif_sevs = getattr(req_or_langs, "notification_severities", None)
    if notif_sevs is None:
        notif_sevs = kwargs.get("notification_severities", current.notification_severities)

    qh_enabled = getattr(req_or_langs, "quiet_hours_enabled", None)
    if qh_enabled is None:
        qh_enabled = kwargs.get("quiet_hours_enabled", current.quiet_hours_enabled)

    qh_start = getattr(req_or_langs, "quiet_hours_start", None)
    if qh_start is None:
        qh_start = kwargs.get("quiet_hours_start", current.quiet_hours_start)

    qh_end = getattr(req_or_langs, "quiet_hours_end", None)
    if qh_end is None:
        qh_end = kwargs.get("quiet_hours_end", current.quiet_hours_end)

    new_settings = SettingsModel(
        default_language="en",
        enabled_languages=langs,
        ui_language=ui_lang if is_valid_language_code(ui_lang) else "en",
        read_aloud_language=read_lang if is_valid_language_code(read_lang) else "en",
        notification_sound=bool(notif_sound),
        notification_browser_push=bool(notif_push),
        notification_severities=notif_sevs or ["critical", "warning", "info"],
        quiet_hours_enabled=bool(qh_enabled),
        quiet_hours_start=qh_start or "22:00",
        quiet_hours_end=qh_end or "07:00"
    )

    return save_settings(new_settings)
