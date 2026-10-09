"""
Language Configuration & Registry for DischargeAI.
Defines supported Indic and global healthcare languages, BCP-47 tags,
Unicode font families, and preview sentences.
"""

from typing import Dict, Any, List

SUPPORTED_LANGUAGES: Dict[str, Dict[str, Any]] = {
    "en": {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "speech_tag": "en-IN",
        "font_family": "Inter, system-ui, sans-serif",
        "is_default": True,
        "sample_preview": "Take Metformin 500mg twice daily after meals. Do not skip doses."
    },
    "hi": {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "speech_tag": "hi-IN",
        "font_family": "'Noto Sans Devanagari', sans-serif",
        "is_default": False,
        "sample_preview": "भोजन के बाद दिन में दो बार मेटफॉर्मिन 500mg लें। कोई खुराक न छोड़ें।"
    },
    "ta": {
        "code": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "speech_tag": "ta-IN",
        "font_family": "'Noto Sans Tamil', sans-serif",
        "is_default": False,
        "sample_preview": "உணவுக்குப் பிறகு தினமும் இரண்டு முறை மெட்ஃபோர்மின் 500mg எடுத்துக்கொள்ளவும். அளவைத் தவிர்க்க வேண்டாம்."
    },
    "te": {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "speech_tag": "te-IN",
        "font_family": "'Noto Sans Telugu', sans-serif",
        "is_default": False,
        "sample_preview": "భోజనం తర్వాత రోజుకు రెండుసార్లు మెట్‌ఫార్మిన్ 500mg తీసుకోండి. మోతాదును దాటవేయవద్దు."
    },
    "kn": {
        "code": "kn",
        "name": "Kannada",
        "native_name": "ಕನ್ನಡ",
        "speech_tag": "kn-IN",
        "font_family": "'Noto Sans Kannada', sans-serif",
        "is_default": False,
        "sample_preview": "ಊಟದ ನಂತರ ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಮೆಟ್‌ಫಾರ್ಮಿನ್ 500mg ತೆಗೆದುಕೊಳ್ಳಿ. ಡೋಸ್ ತಪ್ಪಿಸಬೇಡಿ."
    },
    "ml": {
        "code": "ml",
        "name": "Malayalam",
        "native_name": "മലയാളം",
        "speech_tag": "ml-IN",
        "font_family": "'Noto Sans Malayalam', sans-serif",
        "is_default": False,
        "sample_preview": "ഭക്ഷണത്തിന് ശേഷം ദിവസത്തിൽ രണ്ടുതവണ മെറ്റ്ഫോർമിൻ 500mg കഴിക്കുക. ഡോസ് ഒഴിവാക്കരുത്."
    },
    "bn": {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "speech_tag": "bn-IN",
        "font_family": "'Noto Sans Bengali', sans-serif",
        "is_default": False,
        "sample_preview": "খাবারের পরে দিনে দুবার মেটফর্মিন 500mg নিন। ডোজ বাদ দেবেন না।"
    },
    "mr": {
        "code": "mr",
        "name": "Marathi",
        "native_name": "मराठी",
        "speech_tag": "mr-IN",
        "font_family": "'Noto Sans Devanagari', sans-serif",
        "is_default": False,
        "sample_preview": "जेवणानंतर दिवसातून दोनदा मेटफॉर्मिन 500mg घ्या. डोस चुकवू नका."
    },
    "gu": {
        "code": "gu",
        "name": "Gujarati",
        "native_name": "ગુજરાતી",
        "speech_tag": "gu-IN",
        "font_family": "'Noto Sans Gujarati', sans-serif",
        "is_default": False,
        "sample_preview": "જમ્યા પછી દિવસમાં બે વાર મેટફોર્મિન 500mg લો. ડોઝ ચૂકશો નહીં."
    },
    "pa": {
        "code": "pa",
        "name": "Punjabi",
        "native_name": "ਪੰਜਾਬੀ",
        "speech_tag": "pa-IN",
        "font_family": "'Noto Sans Gurmukhi', sans-serif",
        "is_default": False,
        "sample_preview": "ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ ਮੈਟਫੋਰਮਿਨ 500mg ਲਓ। ਕੋਈ ਖੁਰਾਕ ਨਾ ਛੱਡੋ।"
    },
    "ur": {
        "code": "ur",
        "name": "Urdu",
        "native_name": "اردو",
        "speech_tag": "ur-IN",
        "font_family": "'Noto Nastaliq Urdu', sans-serif",
        "is_default": False,
        "sample_preview": "کھانے کے بعد دن میں دو بار میٹفارمین 500mg لیں۔ کوئی خوراک نہ چھوڑیں۔"
    }
}


def get_supported_languages_list() -> List[Dict[str, Any]]:
    return list(SUPPORTED_LANGUAGES.values())


def is_valid_language_code(code: str) -> bool:
    return code in SUPPORTED_LANGUAGES
