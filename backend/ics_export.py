"""
iCalendar (.ics) RFC 5545 exporter for DischargeAI.
Exports medication dosages, doctor appointments, tests, and wound care reminders
into standard calendar format compatible with Google Calendar, Apple Calendar, and Outlook.
"""

from datetime import datetime, timedelta
from typing import List
from models import FollowUpTask


def generate_ics_calendar(patient_name: str, tasks: List[FollowUpTask]) -> str:
    """
    Generates an RFC 5545 compliant iCalendar string for the patient's schedule.
    """
    now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    today = datetime.utcnow().date()

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Care Bridge//Care Schedule Coordinator//EN",
        f"X-WR-CALNAME:Care Bridge Follow-up Plan - {patient_name}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]

    for idx, task in enumerate(tasks):
        times = task.times_of_day or ["09:00"]
        duration_days = task.duration_days or (30 if task.type == "Medication" else 7)

        for day_offset in range(min(duration_days, 14)):  # Generate for next 14 days
            event_date = today + timedelta(days=day_offset)

            for t_str in times:
                try:
                    hour, minute = [int(p) for p in t_str.split(":", 1)]
                except Exception:
                    hour, minute = 9, 0

                dt_start = datetime(event_date.year, event_date.month, event_date.day, hour, minute)
                dt_end = dt_start + timedelta(minutes=15 if task.type == "Medication" else 60)

                dt_start_str = dt_start.strftime("%Y%m%dT%H%M%S")
                dt_end_str = dt_end.strftime("%Y%m%dT%H%M%S")
                uid = f"carebridge-{task.id}-{day_offset}-{hour}{minute}@carebridge.local"

                summary = f"[{task.type}] {task.simple_language[:60]}"
                description = f"{task.simple_language}\\n\\nHindi: {task.hindi_translation or 'N/A'}\\n\\nTamil: {task.tamil_translation or 'N/A'}\\n\\nOriginal instruction: {task.original_text}"

                lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{now_str}",
                    f"DTSTART:{dt_start_str}",
                    f"DTEND:{dt_end_str}",
                    f"SUMMARY:{summary}",
                    f"DESCRIPTION:{description}",
                    "STATUS:CONFIRMED",
                    "BEGIN:VALARM",
                    "TRIGGER:-PT15M",
                    "ACTION:DISPLAY",
                    f"DESCRIPTION:Reminder: {summary}",
                    "END:VALARM",
                    "END:VEVENT"
                ])

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)
