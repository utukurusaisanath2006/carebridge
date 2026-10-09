"""
Timing Parser and Schedule Slot Generator for DischargeAI.
Derives structured frequency, meal relation, duration, and default clock times
strictly from explicit medical notes without guessing.
"""

import re
from typing import Dict, Any, List, Optional


def parse_schedule_from_text(text: str) -> Dict[str, Any]:
    """
    Extracts structured timing details from instructional text.
    Returns:
    {
        "frequency_per_day": int or None,
        "times_of_day": ["08:00", ...],
        "meal_relation": "before" | "after" | "with" | "none",
        "duration_days": int or None,
        "is_ambiguous": bool
    }
    """
    lower = text.lower()
    freq = None
    times: List[str] = []
    meal_rel = "none"
    duration = None
    is_ambiguous = False

    # 1. Meal Relation
    if "after meal" in lower or "after food" in lower or "after breakfast" in lower or "after lunch" in lower or "after dinner" in lower:
        meal_rel = "after"
    elif "before meal" in lower or "before food" in lower or "empty stomach" in lower:
        meal_rel = "before"
    elif "with meal" in lower or "with food" in lower or "with breakfast" in lower:
        meal_rel = "with"

    # 2. Duration extraction (e.g., "for 3 days", "within 7 days", "in 2 weeks")
    dur_days_match = re.search(r"\bfor\s+(\d+)\s*days?\b", lower)
    if dur_days_match:
        duration = int(dur_days_match.group(1))
    else:
        dur_weeks_match = re.search(r"\bfor\s+(\d+)\s*weeks?\b", lower)
        if dur_weeks_match:
            duration = int(dur_weeks_match.group(1)) * 7
        else:
            within_days_match = re.search(r"\bwithin\s+(\d+)\s*days?\b", lower)
            if within_days_match:
                duration = int(within_days_match.group(1))

    # 3. Frequency and Default Clock Times
    if "twice daily" in lower or "two times a day" in lower or "bid" in lower or "twice a day" in lower:
        freq = 2
        times = ["08:00", "20:00"]
    elif "three times daily" in lower or "thrice daily" in lower or "tid" in lower or "3 times a day" in lower:
        freq = 3
        times = ["08:00", "14:00", "20:00"]
    elif "four times daily" in lower or "qid" in lower or "4 times a day" in lower:
        freq = 4
        times = ["08:00", "12:00", "16:00", "20:00"]
    elif "bedtime" in lower or "at night" in lower or "before sleeping" in lower:
        freq = 1
        times = ["21:00"]
    elif "once daily" in lower or "once a day" in lower or "in the morning" in lower or "daily" in lower:
        freq = 1
        times = ["08:00"]
    elif "as needed" in lower or "when necessary" in lower or "prn" in lower:
        freq = None
        times = []
        is_ambiguous = True

    return {
        "frequency_per_day": freq,
        "times_of_day": times,
        "meal_relation": meal_rel,
        "duration_days": duration,
        "is_ambiguous": is_ambiguous
    }
