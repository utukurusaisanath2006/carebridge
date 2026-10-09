"""
Synthetic Clinical Discharge Summaries and Precomputed Ground-Truth Plans for DischargeAI.
100% Synthetic Data. Zero Real Patient Health Information (PHI).
Language-agnostic architecture supporting English by default, plus operator-selected languages.
"""

SAMPLE_DIABETES_SUMMARY = """Patient: Ramesh Kumar, 58M
Discharged from: Apollo Hospital, Chennai
Date: 08-Oct-2026
Diagnosis: Type 2 Diabetes with Hypertension, post-hypoglycemic episode

Instructions:
1. Take Metformin 500mg twice daily after meals. Do not skip doses.
2. Take Amlodipine 5mg once daily in the morning.
3. Follow-up with Dr. Priya Sharma (Endocrinologist) within 7 days. Contact: 044-XXXXXXX
4. Get HbA1c and fasting glucose blood test done within 3 days at any certified lab.
5. Avoid sugar, white rice, and fried foods. Prefer whole grains, vegetables, and low-fat protein.
6. Monitor blood pressure at home daily. Target: below 130/80.
7. Warning: If blood sugar drops below 70 mg/dL or patient feels dizzy, sweating, or confused — go to emergency immediately.
8. Wound care: Clean the IV site on left arm with antiseptic daily for 3 days.
9. Refer to dietitian for a structured meal plan — patient mentioned difficulty understanding dietary restrictions."""

SAMPLE_CARDIAC_SUMMARY = """Patient: Sunita Patel, 64F
Discharged from: Fortis Memorial Hospital, Gurugram
Date: 08-Oct-2026
Diagnosis: Post-percutaneous coronary intervention (stent placement) for unstable angina

Instructions:
1. Take Aspirin 75mg once daily with breakfast.
2. Take Clopidogrel 75mg once daily after lunch. Do not stop blood thinners without cardiologist approval.
3. Take Atorvastatin 40mg at bedtime.
4. Follow-up with Dr. Arvind Mehra (Cardiology) in 2 weeks with a 12-lead ECG.
5. Avoid lifting heavy weights over 5 kg and strenuous exertion for 10 days.
6. Check femoral puncture site in right groin daily for redness, swelling, or active bleeding.
7. Warning: If severe chest pain, shortness of breath, or bleeding occurs, call emergency right away.
8. Low-sodium, heart-healthy diet; restrict fluid intake if ankle swelling occurs.
9. Needs human review: patient reported mild allergy reaction to generic statins in 2021."""

SAMPLE_PEDIATRIC_SUMMARY = """Patient: Aarav Sharma, 6M
Discharged from: Max Super Speciality Hospital, New Delhi
Date: 08-Oct-2026
Diagnosis: Acute Viral Bronchitis with High-Grade Febrile Episode

Instructions:
1. Give Paracetamol syrup 250mg/5ml, 5ml every 6 hours only if temperature exceeds 100.4 F.
2. Give Salbutamol inhaler 2 puffs with spacer twice daily for 5 days.
3. Keep the child well-hydrated with warm oral fluids, soups, and electrolyte solutions.
4. Follow-up with Dr. Neha Kapoor (Pediatrician) in 5 days at OPD Room 204.
5. Warning: If child shows rapid chest retractions, blue lips, or stays unusually lethargic, rush to pediatric emergency immediately.
6. Monitor body temperature with a digital armpit thermometer every 4 hours.
7. Avoid cold drinks, oily snacks, and exposure to dusty air or cigarette smoke."""

# Canonical precomputed plan for Ramesh Kumar
SAMPLE_DIABETES_PLAN = {
    "patient_name": "Ramesh Kumar, 58M",
    "discharge_date": "08-Oct-2026",
    "hospital_name": "Apollo Hospital, Chennai",
    "overall_summary": "Mr. Ramesh Kumar is recovering from a low blood sugar episode alongside existing diabetes and high blood pressure. He requires daily medications, scheduled doctor and lab checkups, and strict monitoring of blood pressure and glucose levels.",
    "overall_summary_translations": {
        "hi": "श्री रमेश कुमार मौजूदा मधुमेह और उच्च रक्तचाप के साथ कम ब्लड शुगर के प्रकरण से उबर रहे हैं। उन्हें दैनिक दवाओं, निर्धारित डॉक्टर और लैब जांच, तथा रक्तचाप और ग्लूकोज के स्तर की सख्त निगरानी की आवश्यकता है।",
        "ta": "திரு. ரமேஷ் குமார் ஏற்கனவே உள்ள நீரிழிவு மற்றும் உயர் இரத்த அழுத்தத்துடன் குறைவான இரத்த சர்க்கரை நிகழ்வில் இருந்து மீண்டு வருகிறார். அவருக்கு தினசரி மருந்துகள், திட்டமிடப்பட்ட மருத்துவர் மற்றும் ஆய்வக பரிசோதனைகள், மற்றும் இரத்த அழுத்தம் மற்றும் சர்க்கரை அளவை தீவிரமாக கண்காணிப்பது அவசியம்."
    },
    "urgent_warnings": [
        "If blood sugar drops below 70 mg/dL or you feel dizzy, sweating, or confused — go to emergency immediately."
    ],
    "urgent_warnings_translations": {
        "hi": [
            "यदि ब्लड शुगर 70 mg/dL से नीचे गिर जाए या आपको चक्कर, पसीना या भ्रम महसूस हो — तो तुरंत इमरजेंसी जाएं।"
        ],
        "ta": [
            "இரத்த சர்க்கரை 70 mg/dL-க்கு கீழே குறைந்தால் அல்லது மயக்கம், வியர்வை, குழப்பம் ஏற்பட்டால் — உடனடியாக அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும்."
        ]
    },
    "confidence_note": "Extracted with high confidence from Apollo Hospital discharge summary. Two items flagged for human escalation: hypoglycemia emergency warning protocol and patient-noted dietary comprehension barrier.",
    "confidence_note_translations": {
        "hi": "अपोलो अस्पताल के डिस्चार्ज सारांश से उच्च विश्वसनीयता के साथ निकाला गया। मानव समीक्षा के लिए दो मदें चिह्नित: हाइपोग्लाइसीमिया आपातकालीन चेतावनी और आहार संबंधी समझने में कठिनाई।",
        "ta": "அப்பல்லோ மருத்துவமனை டிஸ்சார்ஜ் குறிப்பிலிருந்து அதிக துல்லியத்துடன் பிரித்தெடுக்கப்பட்டது. மனித ஆய்வுக்கு இரண்டு உருப்படிகள் கொடியிடப்பட்டுள்ளன: குறைந்த சர்க்கரை அவசர எச்சரிக்கை மற்றும் உணவு புரிதல் சிரமம்."
    },
    "is_fallback": False,
    "ai_model": "claude-sonnet-4-6",
    "diagnosis": "Type 2 Diabetes with Hypertension, post-hypoglycemic episode",
    "patient_age_gender": "58M",
    "enabled_languages": ["en"],
    "follow_up_tasks": [
        {
            "id": "task-med-1",
            "type": "Medication",
            "original_text": "1. Take Metformin 500mg twice daily after meals. Do not skip doses.",
            "simple_language": "Take Metformin 500mg two times every day after eating your food. Never skip a dose.",
            "translations": {
                "hi": "भोजन के बाद दिन में दो बार Metformin 500mg लें। कोई भी खुराक न छोड़ें।",
                "ta": "உணவுக்குப் பிறகு தினமும் இரண்டு முறை Metformin 500mg எடுத்துக்கொள்ளவும். மாத்திரையைத் தவறவிடாதீர்கள்."
            },
            "reminder_text": {
                "hi": "Metformin 500mg लें (दोपहर/रात)",
                "ta": "Metformin 500mg எடுத்துக்கொள்ளவும்"
            },
            "hindi_translation": "भोजन के बाद दिन में दो बार Metformin 500mg लें। कोई भी खुराक न छोड़ें।",
            "tamil_translation": "உணவுக்குப் பிறகு தினமும் இரண்டு முறை Metformin 500mg எடுத்துக்கொள்ளவும். மாத்திரையைத் தவறவிடாதீர்கள்.",
            "due_date": "Daily",
            "provider_or_facility": None,
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "1. Take Metformin 500mg twice daily after meals. Do not skip doses.",
            "frequency_per_day": 2,
            "times_of_day": ["08:00", "20:00"],
            "meal_relation": "after",
            "duration_days": 30,
            "dose_amount": "500mg"
        },
        {
            "id": "task-med-2",
            "type": "Medication",
            "original_text": "2. Take Amlodipine 5mg once daily in the morning.",
            "simple_language": "Take Amlodipine 5mg one time every morning.",
            "translations": {
                "hi": "सुबह एक बार Amlodipine 5mg लें।",
                "ta": "காலையில் ஒரு முறை Amlodipine 5mg எடுத்துக்கொள்ளவும்."
            },
            "reminder_text": {
                "hi": "Amlodipine 5mg लें",
                "ta": "Amlodipine 5mg எடுத்துக்கொள்ளவும்"
            },
            "hindi_translation": "सुबह एक बार Amlodipine 5mg लें।",
            "tamil_translation": "காலையில் ஒரு முறை Amlodipine 5mg எடுத்துக்கொள்ளவும்.",
            "due_date": "Daily morning",
            "provider_or_facility": None,
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "2. Take Amlodipine 5mg once daily in the morning.",
            "frequency_per_day": 1,
            "times_of_day": ["08:00"],
            "meal_relation": "none",
            "duration_days": 30,
            "dose_amount": "5mg"
        },
        {
            "id": "task-app-3",
            "type": "Appointment",
            "original_text": "3. Follow-up with Dr. Priya Sharma (Endocrinologist) within 7 days. Contact: 044-XXXXXXX",
            "simple_language": "See Dr. Priya Sharma (hormone specialist) within 7 days. Call 044-XXXXXXX to book.",
            "translations": {
                "hi": "7 दिनों के भीतर Dr. Priya Sharma (एंडोक्रिनोलॉजिस्ट) से मिलें। संपर्क करें: 044-XXXXXXX",
                "ta": "7 நாட்களுக்குள் Dr. Priya Sharma (எண்டோகிரைனாலஜிஸ்ட்) அவர்களைச் சந்திக்கவும். தொடர்பு: 044-XXXXXXX"
            },
            "reminder_text": {
                "hi": "Dr. Priya Sharma से मिलें",
                "ta": "Dr. Priya Sharma சந்திக்கவும்"
            },
            "hindi_translation": "7 दिनों के भीतर Dr. Priya Sharma (एंडोक्रिनोलॉजिस्ट) से मिलें। संपर्क करें: 044-XXXXXXX",
            "tamil_translation": "7 நாட்களுக்குள் Dr. Priya Sharma (எண்டோகிரைனாலஜிஸ்ட்) அவர்களைச் சந்திக்கவும். தொடர்பு: 044-XXXXXXX",
            "due_date": "Within 7 days (by 15-Oct-2026)",
            "provider_or_facility": "Dr. Priya Sharma (Endocrinologist), Apollo Hospital",
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "3. Follow-up with Dr. Priya Sharma (Endocrinologist) within 7 days. Contact: 044-XXXXXXX",
            "frequency_per_day": 1,
            "times_of_day": ["10:00"],
            "meal_relation": "none",
            "duration_days": 7
        },
        {
            "id": "task-test-4",
            "type": "Test",
            "original_text": "4. Get HbA1c and fasting glucose blood test done within 3 days at any certified lab.",
            "simple_language": "Get your sugar blood tests (HbA1c and fasting glucose) done at a certified lab within 3 days.",
            "translations": {
                "hi": "किसी भी प्रमाणित लैब में 3 दिनों के भीतर HbA1c और खाली पेट ग्लूकोज टेस्ट करवाएं।",
                "ta": "3 நாட்களுக்குள் அங்கீகரிக்கப்பட்ட ஆய்வகத்தில் HbA1c பரிசோதனை செய்யவும்."
            },
            "reminder_text": {
                "hi": "HbA1c रक्त जांच करवाएं",
                "ta": "HbA1c பரிசோதனை செய்யவும்"
            },
            "hindi_translation": "किसी भी प्रमाणित लैब में 3 दिनों के भीतर HbA1c और खाली पेट ग्लूकोज टेस्ट करवाएं।",
            "tamil_translation": "3 நாட்களுக்குள் அங்கீகரிக்கப்பட்ட ஆய்வகத்தில் HbA1c பரிசோதனை செய்யவும்.",
            "due_date": "Within 3 days (by 11-Oct-2026)",
            "provider_or_facility": "Any certified lab",
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "4. Get HbA1c and fasting glucose blood test done within 3 days at any certified lab.",
            "frequency_per_day": 1,
            "times_of_day": ["07:30"],
            "meal_relation": "before",
            "duration_days": 3
        },
        {
            "id": "task-diet-5",
            "type": "Diet",
            "original_text": "5. Avoid sugar, white rice, and fried foods. Prefer whole grains, vegetables, and low-fat protein.",
            "simple_language": "Stay away from sweets, white rice, and fried foods. Eat whole grains, vegetables, and lean protein.",
            "translations": {
                "hi": "चीनी, सफेद चावल और तली हुई चीजों से बचें। साबुत अनाज और सब्जियां लें।",
                "ta": "சர்க்கரை, வெள்ளை அரிசி மற்றும் வறுத்த உணவுகளைத் தவிர்க்கவும்."
            },
            "reminder_text": {
                "hi": "मधुमेह आहार नियमों का पालन करें",
                "ta": "உணவு கட்டுப்பாடுகளைப் பின்பற்றவும்"
            },
            "hindi_translation": "चीनी, सफेद चावल और तली हुई चीजों से बचें। साबुत अनाज और सब्जियां लें।",
            "tamil_translation": "சர்க்கரை, வெள்ளை அரிசி மற்றும் வறுத்த உணவுகளைத் தவிர்க்கவும்.",
            "due_date": "Ongoing",
            "provider_or_facility": None,
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "5. Avoid sugar, white rice, and fried foods. Prefer whole grains, vegetables, and low-fat protein.",
            "frequency_per_day": 3,
            "times_of_day": ["08:30", "13:00", "20:30"],
            "meal_relation": "with"
        },
        {
            "id": "task-test-6",
            "type": "Test",
            "original_text": "6. Monitor blood pressure at home daily. Target: below 130/80.",
            "simple_language": "Check your blood pressure at home every day. Keep it under 130/80.",
            "translations": {
                "hi": "घर पर रोजाना रक्तचाप (BP) मापें। लक्ष्य: 130/80 से नीचे।",
                "ta": "வீட்டில் தினமும் இரத்த அழுத்தத்தை அளவிடவும். இலக்கு: 130/80-க்கு கீழ்."
            },
            "reminder_text": {
                "hi": "रक्तचाप (BP) जांचें",
                "ta": "இரத்த அழுத்தம் சரிபார்க்கவும்"
            },
            "hindi_translation": "घर पर रोजाना रक्तचाप (BP) मापें। लक्ष्य: 130/80 से नीचे।",
            "tamil_translation": "வீட்டில் தினமும் இரத்த அழுத்தத்தை அளவிடவும். இலக்கு: 130/80-க்கு கீழ்.",
            "due_date": "Daily",
            "provider_or_facility": "Home monitoring",
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "6. Monitor blood pressure at home daily. Target: below 130/80.",
            "frequency_per_day": 1,
            "times_of_day": ["09:00"],
            "meal_relation": "none"
        },
        {
            "id": "task-warn-7",
            "type": "Warning Sign",
            "original_text": "7. Warning: If blood sugar drops below 70 mg/dL or patient feels dizzy, sweating, or confused — go to emergency immediately.",
            "simple_language": "Danger warning: If sugar falls below 70, or you feel dizzy, sweaty, or confused, go to the emergency room immediately.",
            "translations": {
                "hi": "चेतावनी: यदि ब्लड शुगर 70 mg/dL से नीचे गिरे या चक्कर आए तो तुरंत इमरजेंसी जाएं।",
                "ta": "எச்சரிக்கை: இரத்த சர்க்கரை 70 mg/dL-க்கு கீழ் குறைந்தால் உடனடியாக அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும்."
            },
            "reminder_text": {
                "hi": "आपातकालीन चेतावनी: लो शुगर",
                "ta": "அவசர எச்சரிக்கை: குறைந்த சர்க்கரை"
            },
            "hindi_translation": "चेतावनी: यदि ब्लड शुगर 70 mg/dL से नीचे गिरे या चक्कर आए तो तुरंत इमरजेंसी जाएं।",
            "tamil_translation": "எச்சரிக்கை: இரத்த சர்க்கரை 70 mg/dL-க்கு கீழ் குறைந்தால் உடனடியாக அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும்.",
            "due_date": "Immediate / As needed",
            "provider_or_facility": "Emergency Department",
            "status": "Pending",
            "escalate_to_human": True,
            "escalation_reason": "Critical acute hypoglycemia warning threshold requiring immediate emergency intervention.",
            "source_line": "7. Warning: If blood sugar drops below 70 mg/dL or patient feels dizzy, sweating, or confused — go to emergency immediately."
        },
        {
            "id": "task-wound-8",
            "type": "Wound Care",
            "original_text": "8. Wound care: Clean the IV site on left arm with antiseptic daily for 3 days.",
            "simple_language": "Gently clean the needle spot on your left arm using antiseptic medicine daily for 3 days.",
            "translations": {
                "hi": "बाएं हाथ पर IV वाली जगह को 3 दिनों तक रोजाना एंटीसेप्टिक से साफ करें।",
                "ta": "இடது கையில் IV ஊசி போட்ட இடத்தை தினமும் 3 நாட்களுக்கு கிருமிநாசினி கொண்டு சுத்தம் செய்யவும்."
            },
            "reminder_text": {
                "hi": "IV घाव की ड्रेसिंग करें",
                "ta": "IV காயத்தைச் சுத்தம் செய்யவும்"
            },
            "hindi_translation": "बाएं हाथ पर IV वाली जगह को 3 दिनों तक रोजाना एंटीसेप्टिक से साफ करें।",
            "tamil_translation": "இடது கையில் IV ஊசி போட்ட இடத்தை தினமும் 3 நாட்களுக்கு கிருமிநாசினி கொண்டு சுத்தம் செய்யவும்.",
            "due_date": "Daily for 3 days",
            "provider_or_facility": "Home care",
            "status": "Pending",
            "escalate_to_human": False,
            "escalation_reason": None,
            "source_line": "8. Wound care: Clean the IV site on left arm with antiseptic daily for 3 days.",
            "frequency_per_day": 1,
            "times_of_day": ["10:30"],
            "duration_days": 3
        },
        {
            "id": "task-ref-9",
            "type": "Referral",
            "original_text": "9. Refer to dietitian for a structured meal plan — patient mentioned difficulty understanding dietary restrictions.",
            "simple_language": "Meet with a dietitian to get a clear meal guide, because understanding diet rules has been difficult.",
            "translations": {
                "hi": "एक व्यवस्थित भोजन योजना के लिए आहार विशेषज्ञ से परामर्श लें — मरीज को आहार समझने में कठिनाई है।",
                "ta": "உணவுத் திட்டத்திற்கு உணவியல் நிபுணரை அணுகவும் — நோயாளிக்கு உணவு கட்டுப்பாடுகளில் சிரமம் உள்ளது."
            },
            "reminder_text": {
                "hi": "आहार विशेषज्ञ से संपर्क करें",
                "ta": "உணவியல் நிபுணரை அணுகவும்"
            },
            "hindi_translation": "एक व्यवस्थित भोजन योजना के लिए आहार विशेषज्ञ से परामर्श लें — मरीज को आहार समझने में कठिनाई है।",
            "tamil_translation": "உணவுத் திட்டத்திற்கு உணவியல் நிபுணரை அணுகவும் — நோயாளிக்கு உணவு கட்டுப்பாடுகளில் சிரமம் உள்ளது.",
            "due_date": "Upcoming",
            "provider_or_facility": "Clinical Dietitian",
            "status": "Needs Review",
            "escalate_to_human": True,
            "escalation_reason": "Patient expressed comprehension difficulty regarding dietary restrictions; personalized human clinical counseling required.",
            "source_line": "9. Refer to dietitian for a structured meal plan — patient mentioned difficulty understanding dietary restrictions."
        }
    ],
    "confidence_note": "Extracted with high confidence from Apollo Hospital discharge summary. Two items flagged for human escalation: hypoglycemia emergency warning protocol and patient-noted dietary comprehension barrier."
}
