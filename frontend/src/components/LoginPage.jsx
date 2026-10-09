import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings, API_BASE } from '../context/SettingsContext';
import EmblemHeroVisual from './EmblemHeroVisual';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  Hospital,
  CheckCircle2,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  HeartPulse,
  UserPlus,
  ShieldCheck,
  Check,
  Plus,
  X,
  Sun,
  Moon,
  Pause,
  Play,
  FileText,
  Clock,
  AlertTriangle,
  Activity,
  Layers
} from 'lucide-react';

export default function LoginPage() {
  const { login, registerPatient, loading } = useAuth();
  const {
    settings,
    updateSettings,
    supportedLanguages,
    t,
    theme,
    toggleTheme,
    isDark,
    motionPaused,
    toggleMotion
  } = useSettings();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [activeNav, setActiveNav] = useState('#how-it-works');
  const formCardRef = useRef(null);

  // --- Login State ---
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('Operator@123');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // --- Registration State ---
  const [regStep, setRegStep] = useState(1); // 1 | 2 | 3
  const [regError, setRegError] = useState(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Step 1: Account
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Mobile OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState(null);

  // Step 2: Patient Details
  const [regFullName, setRegFullName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regSex, setRegSex] = useState('Male');
  const [regUhid, setRegUhid] = useState('');
  const [regPrefLang, setRegPrefLang] = useState(settings.ui_language || 'en');
  
  const [allergiesList, setAllergiesList] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  
  const [conditionsList, setConditionsList] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  
  const [medicinesList, setMedicinesList] = useState([]);
  const [medicineInput, setMedicineInput] = useState('');

  const [morningTime, setMorningTime] = useState('08:00');
  const [afternoonTime, setAfternoonTime] = useState('13:00');
  const [eveningTime, setEveningTime] = useState('18:00');
  const [nightTime, setNightTime] = useState('21:00');

  // Step 3: Caregiver & Consent
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRelation, setCaregiverRelation] = useState('Family');
  const [caregiverMobile, setCaregiverMobile] = useState('');
  const [consentDpdp, setConsentDpdp] = useState(true);
  const [consentReminders, setConsentReminders] = useState(true);
  const [consentCaregiver, setConsentCaregiver] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!regPassword) return { score: 0, label: '', color: 'bg-[#F5F2ED]/20' };
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (/[A-Z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;

    switch (score) {
      case 1:
        return { score, label: t('register.strengthWeak', null, 'Weak'), color: 'bg-[#FF4D5E]' };
      case 2:
        return { score, label: t('register.strengthFair', null, 'Fair'), color: 'bg-[#F5B94A]' };
      case 3:
        return { score, label: t('register.strengthGood', null, 'Good'), color: 'bg-[#FF9A62]' };
      case 4:
        return { score, label: t('register.strengthStrong', null, 'Strong'), color: 'bg-[#55D6A2]' };
      default:
        return { score: 0, label: '', color: 'bg-[#F5F2ED]/20' };
    }
  }, [regPassword, t]);

  const handleDobChange = (e) => {
    const val = e.target.value;
    setRegDob(val);
    if (val) {
      const birthYear = new Date(val).getFullYear();
      const currentYear = new Date().getFullYear();
      if (birthYear > 1900 && currentYear >= birthYear) {
        setRegAge(String(currentYear - birthYear));
      }
    }
  };

  const addAllergy = (val) => {
    const item = (val || allergyInput).trim();
    if (item && !allergiesList.includes(item)) {
      setAllergiesList([...allergiesList, item]);
    }
    setAllergyInput('');
  };
  const removeAllergy = (idx) => {
    setAllergiesList(allergiesList.filter((_, i) => i !== idx));
  };

  const addCondition = (val) => {
    const item = (val || conditionInput).trim();
    if (item && !conditionsList.includes(item)) {
      setConditionsList([...conditionsList, item]);
    }
    setConditionInput('');
  };
  const removeCondition = (idx) => {
    setConditionsList(conditionsList.filter((_, i) => i !== idx));
  };

  const addMedicine = (val) => {
    const item = (val || medicineInput).trim();
    if (item && !medicinesList.includes(item)) {
      setMedicinesList([...medicinesList, item]);
    }
    setMedicineInput('');
  };
  const removeMedicine = (idx) => {
    setMedicinesList(medicinesList.filter((_, i) => i !== idx));
  };

  const scrollToForm = (targetMode) => {
    setMode(targetMode);
    if (formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // --- Submit Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    if (!username.trim() || !password) {
      setLoginError(t('auth.missingFields', null, 'Please enter both username and password.'));
      return;
    }
    setLoginSubmitting(true);
    try {
      await login(username.trim(), password, rememberMe);
    } catch (err) {
      setLoginError(err.message || t('auth.invalidCredentials', null, 'Invalid credentials. Please try again.'));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoginError(null);
  };

  // --- OTP Verification Handlers ---
  const handleSendOtp = async () => {
    setRegError(null);
    setOtpNotice(null);
    const cleanMobile = regMobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setRegError(t('register.validationMobile', null, 'Please enter a valid 10-digit mobile number first.'));
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: regMobile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setOtpSent(true);
      setDemoOtp(data.otp || '1234');
      setOtpCode(data.otp || '1234'); // Auto-fill for instant frictionless demo!
      setOtpNotice(`OTP sent! Demo code is ${data.otp || '1234'}`);
    } catch (err) {
      setRegError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setRegError(null);
    setOtpNotice(null);
    if (!otpCode.trim()) {
      setRegError('Please enter the 4-digit verification code.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: regMobile, otp: otpCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid OTP code.');
      setOtpVerified(true);
      setOtpNotice('Mobile number verified successfully ✓');
    } catch (err) {
      setRegError(err.message || 'Invalid or expired OTP. Use demo code 1234.');
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Step 1 Next Validation ---
  const handleStep1Next = () => {
    setRegError(null);
    if (!regUsername.trim() || regUsername.length < 3) {
      setRegError(t('register.validationRequired', null, 'Username must be at least 3 characters.'));
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setRegError(t('register.validationPwStrength', null, 'Password must be at least 8 characters with 1 uppercase, 1 digit, and 1 symbol.'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError(t('register.validationPwMatch', null, 'Passwords do not match.'));
      return;
    }
    const cleanMobile = regMobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setRegError(t('register.validationMobile', null, 'Please enter a valid 10-digit mobile number.'));
      return;
    }
    if (!otpVerified) {
      setRegError('Please verify your mobile number with OTP before proceeding (click "Send OTP" then "Verify").');
      return;
    }
    setRegStep(2);
  };

  // --- Step 2 Next Validation ---
  const handleStep2Next = () => {
    setRegError(null);
    if (!regFullName.trim()) {
      setRegError(t('register.validationRequired', null, 'Full patient name is required.'));
      return;
    }
    setRegStep(3);
  };

  // --- Step 3 Complete Registration ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);

    setRegSubmitting(true);
    try {
      const payload = {
        username: regUsername.trim(),
        password: regPassword,
        mobile: regMobile.trim(),
        email: regEmail.trim() || null,
        full_name: regFullName.trim(),
        dob: regDob || "1975-01-01",
        date_of_birth: regDob || "1975-01-01",
        age: parseInt(regAge, 10) || 50,
        sex: regSex || "Other",
        uhid: regUhid.trim() || `UHID-${Math.floor(100000 + Math.random() * 900000)}`,
        discharge_date: new Date().toISOString().slice(0, 10),
        hospital_name: "Apollo Hospital, Chennai",
        preferred_language: regPrefLang || settings.ui_language || 'en',
        allergies: allergiesList,
        conditions: conditionsList,
        chronic_conditions: conditionsList,
        medicines: medicinesList.join(', '),
        current_medicines: medicinesList,
        reminder_times: {
          morning: morningTime,
          afternoon: afternoonTime,
          evening: eveningTime,
          night: nightTime
        },
        caregiver: {
          name: caregiverName.trim() || 'Primary Caregiver',
          relationship: caregiverRelation.trim() || 'Family',
          mobile: caregiverMobile.trim() || regMobile.trim(),
          consent_alerts: consentCaregiver
        },
        consents: {
          ai_disclaimer: true,
          data_processing: consentDpdp,
          demo_notice: true,
          caregiver_alerts: consentCaregiver
        }
      };

      await registerPatient(payload);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    updateSettings({ ui_language: langCode });
    setRegPrefLang(langCode);
  };

  const enabledLangs = (settings.enabled_languages || ['en']).map((code) => {
    return supportedLanguages.find((l) => l.code === code) || { code, name: code, native: code };
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F2ED] flex flex-col justify-between selection:bg-[#FF6242]/20 selection:text-[#FF6242] relative overflow-x-hidden">
      {/* ════════ STICKY COMPACT TOP NAV ════════ */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#050505]/90 border-b border-[rgba(255,98,66,0.22)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Wordmark with Coral Bridge Arc Glyph */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,98,66,0.3)]">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M 5 23 C 9 11, 23 11, 27 23" stroke="#FF6242" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 16 14 L 16 23" stroke="#FF9A62" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <circle cx="16" cy="14" r="2.5" fill="#FF6242" />
                <circle cx="5" cy="23" r="2" fill="#FF6242" />
                <circle cx="27" cy="23" r="2" fill="#FF6242" />
              </svg>
            </div>
            <span className="font-display font-black text-[1.35rem] tracking-[-0.01em] leading-none flex items-center">
              Care<span className="text-[#FF6242]">Bridge</span>
            </span>
          </div>

          {/* Center Links (Anchor Nav with Orange Underline on Active) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a
              href="#how-it-works"
              onClick={() => setActiveNav('#how-it-works')}
              className={`transition-colors py-1 ${
                activeNav === '#how-it-works'
                  ? 'text-[#F5F2ED] border-b-2 border-[#FF6242] font-semibold'
                  : 'text-[#BDB8B0] hover:text-[#F5F2ED]'
              }`}
            >
              {t('nav.howItWorks', null, 'How it works')}
            </a>
            <a
              href="#safety"
              onClick={() => setActiveNav('#safety')}
              className={`transition-colors py-1 ${
                activeNav === '#safety'
                  ? 'text-[#F5F2ED] border-b-2 border-[#FF6242] font-semibold'
                  : 'text-[#BDB8B0] hover:text-[#F5F2ED]'
              }`}
            >
              {t('nav.securityAudit', null, 'Security & Audit')}
            </a>
            <a
              href="#languages"
              onClick={() => setActiveNav('#languages')}
              className={`transition-colors py-1 ${
                activeNav === '#languages'
                  ? 'text-[#F5F2ED] border-b-2 border-[#FF6242] font-semibold'
                  : 'text-[#BDB8B0] hover:text-[#F5F2ED]'
              }`}
            >
              {t('nav.languages', null, 'Languages')}
            </a>
          </nav>

          {/* Right Controls: Language, Theme, Motion, CTAs */}
          <div className="flex items-center gap-2.5">
            {/* Operator-Enabled Language Switcher */}
            {enabledLangs.length > 1 && (
              <div className="relative flex items-center gap-1 bg-[#0E0E0E] px-2.5 py-1.5 rounded-control border border-[rgba(255,98,66,0.22)] text-xs text-[#F5F2ED]">
                <Globe className="w-3.5 h-3.5 text-[#FF6242] shrink-0" />
                <select
                  value={settings.ui_language || 'en'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-[#F5F2ED] focus:outline-none cursor-pointer pr-1"
                  aria-label={t('auth.selectLanguage', null, 'Interface language')}
                >
                  {enabledLangs.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#050505] text-[#F5F2ED]">
                      {lang.native} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Theme Toggle (Cinematic Dark / High-Contrast Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-control bg-[#0E0E0E] border border-[rgba(255,98,66,0.22)] hover:border-[#FF6242]/40 text-[#BDB8B0] hover:text-[#F5F2ED] hover:bg-[#161616] transition-colors cursor-pointer"
              title={isDark ? 'Switch to High-contrast Light' : 'Switch to Cinematic Dark'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#F5B94A]" /> : <Moon className="w-4 h-4 text-[#FF9A62]" />}
            </button>

            {/* Motion Pause Toggle */}
            <button
              type="button"
              onClick={toggleMotion}
              className="p-2 rounded-control bg-[#0E0E0E] border border-[rgba(255,98,66,0.22)] hover:border-[#FF6242]/40 text-[#BDB8B0] hover:text-[#F5F2ED] hover:bg-[#161616] transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={motionPaused ? 'Resume animations' : 'Pause animations'}
              aria-label={motionPaused ? 'Resume animations' : 'Pause animations'}
            >
              {motionPaused ? <Play className="w-3.5 h-3.5 text-[#FF9A62]" /> : <Pause className="w-3.5 h-3.5 text-[#BDB8B0]" />}
            </button>

            {/* Secondary Action: Sign in */}
            <button
              type="button"
              onClick={() => scrollToForm('login')}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-control bg-[#0E0E0E] border border-[#FF6242]/40 hover:border-[#FF6242] hover:bg-[#FF6242]/10 text-[#F5F2ED] transition-all cursor-pointer"
            >
              {t('auth.tabSignIn', null, 'Sign in')}
            </button>

            {/* Primary Action: Register as patient */}
            <button
              type="button"
              onClick={() => scrollToForm('register')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-control bg-[#FF6242] text-[#050505] hover:bg-[#FF7B60] shadow-[0_0_24px_rgba(255,98,66,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('auth.tabRegister', null, 'Register as patient')}</span>
              <span className="sm:hidden">Register</span>
            </button>
          </div>
        </div>
        {/* Faint orange gradient line under the nav */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#FF6242]/40 to-transparent" aria-hidden="true" />
      </header>

      {/* ════════ SIGNATURE HERO SECTION ════════ */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Ambient Orange Radial Glow: Top-Left */}
        <div
          className="pointer-events-none absolute -top-28 -left-20 w-96 h-96 rounded-full opacity-30 blur-3xl z-0"
          style={{ background: 'radial-gradient(circle, rgba(255, 98, 66, 0.32) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Ambient Orange Radial Glow: Behind Emblem (Right Side) */}
        <div
          className="pointer-events-none absolute top-4 right-0 lg:-right-8 w-[640px] h-[640px] rounded-full opacity-40 blur-3xl z-0"
          style={{ background: 'radial-gradient(circle, rgba(255, 98, 66, 0.35) 0%, rgba(255, 154, 98, 0.14) 45%, transparent 72%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column (~55%): Asymmetric Editorial Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Mono Micro-Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6242]/10 border border-[#FF6242]/30 text-[#FF6242]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6242] animate-pulse"></span>
              <span className="font-mono text-xs font-semibold uppercase tracking-wide-mono">
                {t('hero.microLabel', null, 'AGENTIC DISCHARGE COORDINATION')}
              </span>
            </div>

            {/* ── HERO HEADLINE — Barlow Condensed Black 900 (Adobe editorial style) ── */}
            <h1
              className="font-display font-black text-[#F5F2ED] tracking-[-0.02em]"
              style={{
                fontSize: 'clamp(3.2rem, 8.5vw, 7.5rem)',
                lineHeight: 1.0,
                paddingBottom: '0.08em',   /* room for descenders (g, p, y) */
                overflow: 'visible',
              }}
            >
              <span className="block">{t('hero.headlinePart1', null, 'Hospital to home,')}</span>
              <span
                className="block"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #FF6242 0%, #FF8050 55%, #FF9A62 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  paddingBottom: '0.1em',  /* extra insurance for last-line descenders */
                  display: 'block',
                }}
              >
                {t('hero.headlinePart2', null, 'without the gaps.')}
              </span>
            </h1>

            {/* Subheadline — DM Sans 500, generous line-height */}
            <p className="max-w-[52ch] text-[1.1rem] text-[#BDB8B0] leading-[1.7] font-sans font-medium mt-4">
              {t('hero.subtext', null, 'Translating complex clinical discharge summaries into structured, verified, multilingual recovery roadmaps for patients and clinical teams.')}
            </p>

            {/* CTAs: Side-by-side on desktop, stacked on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => scrollToForm('register')}
                className="px-6 py-3.5 rounded-control bg-[#FF6242] text-[#050505] font-bold text-sm shadow-[0_0_32px_rgba(255,98,66,0.35)] hover:bg-[#FF7B60] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('hero.primaryCta', null, 'Access Care Portal')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-control bg-[#0E0E0E] border border-[#FF6242]/40 hover:border-[#FF6242] hover:bg-[#FF6242]/10 text-[#F5F2ED] font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#FF9A62]" />
                <span>{t('hero.secondaryCta', null, 'Watch the demo flow')}</span>
              </button>
            </div>

            {/* Row of 3 Mono Chips (Orange borders and orange mono text) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-4">
              <span className="font-mono text-xs uppercase tracking-wide-mono px-3.5 py-1 rounded-full bg-[#FF6242]/10 border border-[#FF6242]/40 text-[#FF6242]">
                {t('hero.chip1', null, 'AI-ASSISTED')}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide-mono px-3.5 py-1 rounded-full bg-[#FF6242]/10 border border-[#FF6242]/40 text-[#FF6242]">
                {t('hero.chip2', null, 'HUMAN-REVIEWED')}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide-mono px-3.5 py-1 rounded-full bg-[#FF6242]/10 border border-[#FF6242]/40 text-[#FF6242]">
                {t('hero.chip3', null, 'MULTILINGUAL')}
              </span>
            </div>
          </div>

          {/* Right Column (~45%): Sacred Geometry Emblem Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <EmblemHeroVisual />
          </div>
        </div>
      </section>

      {/* ════════ RESTRAINED 3-CARD ROW + PIPELINE STRIP ════════ */}
      <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Pipeline Strip (Orange step numerals 01-04, thin orange connector arrows, subtle orange card border) */}
        <div className="w-full bg-[#111111] border border-[rgba(255,98,66,0.22)] p-4 sm:p-5 rounded-card shadow-[0_0_24px_rgba(255,98,66,0.08)] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[640px] text-xs font-mono tracking-wide-mono uppercase text-[#BDB8B0]">
            <div className="flex items-center gap-2 text-[#F5F2ED]">
              <span className="w-2 h-2 rounded-full bg-[#FF6242] animate-pulse"></span>
              <span className="text-[#FF6242] font-bold">01</span>
              <span>{t('pipeline.step1', null, 'INTAKE & OCR')}</span>
            </div>
            <span className="text-[#FF6242]/60 font-sans text-sm font-semibold">→</span>
            <div className="flex items-center gap-2 text-[#F5F2ED]">
              <span className="w-2 h-2 rounded-full bg-[#FF6242]/70"></span>
              <span className="text-[#FF6242] font-bold">02</span>
              <span>{t('pipeline.step2', null, 'AGENTIC STRUCTURING')}</span>
            </div>
            <span className="text-[#FF6242]/60 font-sans text-sm font-semibold">→</span>
            <div className="flex items-center gap-2 text-[#F5F2ED]">
              <span className="w-2 h-2 rounded-full bg-[#FF6242]/70"></span>
              <span className="text-[#FF6242] font-bold">03</span>
              <span>{t('pipeline.step3', null, 'MULTILINGUAL FIDELITY')}</span>
            </div>
            <span className="text-[#FF6242]/60 font-sans text-sm font-semibold">→</span>
            <div className="flex items-center gap-2 text-[#F5F2ED]">
              <span className="w-2 h-2 rounded-full bg-[#FF6242]/70"></span>
              <span className="text-[#FF6242] font-bold">04</span>
              <span>{t('pipeline.step4', null, 'ALARM & ADHERENCE DISPATCH')}</span>
            </div>
          </div>
        </div>

        {/* 3 Restrained Glass Cards (Security & Audit section) */}
        <div id="safety" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111111] border border-[rgba(255,98,66,0.22)] shadow-[0_0_24px_rgba(255,98,66,0.08)] p-6 space-y-3 rounded-card transition-all hover:border-[rgba(255,98,66,0.4)]">
            <div className="w-10 h-10 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/30 flex items-center justify-center text-[#FF6242]">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-syne font-bold text-lg text-[#F5F2ED]">
              {t('feature.extractTitle', null, 'Extract & Simplify')}
            </h3>
            <p className="text-sm text-[#BDB8B0] leading-relaxed">
              {t('feature.extractDesc', null, 'Multimodal ingestion of PDFs, mobile camera charts, and voice dictations. Jargon is translated to Grade-6 plain instructions.')}
            </p>
          </div>

          <div className="bg-[#111111] border border-[rgba(255,98,66,0.22)] shadow-[0_0_24px_rgba(255,98,66,0.08)] p-6 space-y-3 rounded-card transition-all hover:border-[rgba(255,98,66,0.4)]">
            <div className="w-10 h-10 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/30 flex items-center justify-center text-[#FF9A62]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-syne font-bold text-lg text-[#F5F2ED]">
              {t('feature.remindTitle', null, 'Remind & Adhere')}
            </h3>
            <p className="text-sm text-[#BDB8B0] leading-relaxed">
              {t('feature.remindDesc', null, 'Four-slot clinical daily timeline with loud Web Audio oscillator chimes that ring even offline, plus 1-click adherence logging.')}
            </p>
          </div>

          <div className="bg-[#111111] border border-[rgba(255,98,66,0.22)] shadow-[0_0_24px_rgba(255,98,66,0.08)] p-6 space-y-3 rounded-card transition-all hover:border-[rgba(255,98,66,0.4)]">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D5E]/15 border border-[#FF4D5E]/30 flex items-center justify-center text-[#FF4D5E]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-syne font-bold text-lg text-[#F5F2ED]">
              {t('feature.escalateTitle', null, 'Escalate & Protect')}
            </h3>
            <p className="text-sm text-[#BDB8B0] leading-relaxed">
              {t('feature.escalateDesc', null, 'Deterministic drug-safety checks catch duplicate meds, dose omissions, and critical warnings requiring physician sign-off.')}
            </p>
          </div>
        </div>

        {/* 11 Supported Indic Languages Strip */}
        <div id="languages" className="bg-[#111111] border border-[rgba(255,98,66,0.22)] shadow-[0_0_24px_rgba(255,98,66,0.08)] p-5 space-y-3 rounded-card">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide-mono text-[#FF6242]">
              <Globe className="w-4 h-4" />
              <span className="font-bold">11 Supported Indic Languages</span>
            </div>
            <span className="text-[11px] font-mono text-[#BDB8B0]">Grade-6 Plain Language Clinical Fidelity</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {supportedLanguages.map((lang) => (
              <span
                key={lang.code}
                className="px-2.5 py-1 rounded-control bg-[#0E0E0E] border border-[rgba(255,98,66,0.2)] text-xs text-[#F5F2ED] font-medium hover:border-[#FF6242] hover:text-[#FF6242] transition-colors"
              >
                {lang.native} <span className="text-[10px] text-[#BDB8B0]">({lang.name})</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SPLIT AUTHENTICATION CARD OVER HERO ════════ */}
      <section ref={formCardRef} id="product" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#111111] border border-[rgba(255,98,66,0.22)] shadow-[0_0_32px_rgba(255,98,66,0.09)] rounded-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Panel: Clinical Branding & Demo Fill (5 cols) */}
          <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[rgba(255,98,66,0.22)] bg-[#0D0D0D]">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FF6242]/15 border border-[#FF6242]/30 flex items-center justify-center shadow-glow-coral">
                  <Hospital className="w-6 h-6 text-[#FF6242]" />
                </div>
                <div>
                  <h2 className="font-syne font-bold text-xl tracking-tight text-[#F5F2ED] flex items-center gap-1.5">
                    Care<span className="text-[#FF6242]">Bridge</span>
                  </h2>
                  <p className="text-xs text-[#BDB8B0] font-mono uppercase tracking-wide-mono">Care Coordinator</p>
                </div>
              </div>

              <div>
                <h3 className="font-syne font-bold text-2xl text-[#F5F2ED] leading-snug">
                  {t('auth.brandHeadline', null, 'Intelligent Discharge & Patient Follow-up Coordination')}
                </h3>
                <p className="text-sm text-[#BDB8B0] leading-relaxed mt-2">
                  {t('auth.brandSubtitle', null, 'Transforming complex hospital discharge records into structured, multilingual care schedules with closed-loop clinical safety.')}
                </p>
              </div>

              {/* 1-Click Quick Demo Accounts Helper */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-[#BDB8B0] mb-2.5 flex items-center gap-1.5 font-mono uppercase tracking-wide-mono">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF6242]" />
                  <span>{t('auth.demoAccountsHeader', null, 'Quick-Select Demo Accounts (1-Click Fill)')}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Operator */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('operator', 'Operator@123')}
                    className={`p-2.5 rounded-control text-left transition-all cursor-pointer ${
                      username === 'operator'
                        ? 'border border-[rgba(255,98,66,0.4)] border-l-4 border-l-[#FF6242] bg-[#FF6242]/10 shadow-[0_0_16px_rgba(255,98,66,0.25)]'
                        : 'border border-[rgba(255,98,66,0.18)] bg-[#0E0E0E] hover:bg-[#161616] hover:border-[rgba(255,98,66,0.35)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#F5F2ED]">Nurse Joy</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#FF6242]/50 text-[#FF6242] bg-[#FF6242]/10">
                        OPERATOR
                      </span>
                    </div>
                    <p className="text-[10px] text-[#BDB8B0] font-mono truncate">operator / Operator@123</p>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'Admin@123')}
                    className={`p-2.5 rounded-control text-left transition-all cursor-pointer ${
                      username === 'admin'
                        ? 'border border-[rgba(255,98,66,0.4)] border-l-4 border-l-[#FF6242] bg-[#FF6242]/10 shadow-[0_0_16px_rgba(255,98,66,0.25)]'
                        : 'border border-[rgba(255,98,66,0.18)] bg-[#0E0E0E] hover:bg-[#161616] hover:border-[rgba(255,98,66,0.35)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#F5F2ED]">Admin Sharma</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#FF6242]/50 text-[#FF6242] bg-[#FF6242]/10">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[10px] text-[#BDB8B0] font-mono truncate">admin / Admin@123</p>
                  </button>

                  {/* Caregiver */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('caregiver', 'Caregiver@123')}
                    className={`p-2.5 rounded-control text-left transition-all cursor-pointer ${
                      username === 'caregiver'
                        ? 'border border-[rgba(255,98,66,0.4)] border-l-4 border-l-[#FF6242] bg-[#FF6242]/10 shadow-[0_0_16px_rgba(255,98,66,0.25)]'
                        : 'border border-[rgba(255,98,66,0.18)] bg-[#0E0E0E] hover:bg-[#161616] hover:border-[rgba(255,98,66,0.35)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#F5F2ED]">Caregiver Sunita</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#FF6242]/50 text-[#FF6242] bg-[#FF6242]/10">
                        VIEWER
                      </span>
                    </div>
                    <p className="text-[10px] text-[#BDB8B0] font-mono truncate">caregiver / Caregiver@123</p>
                  </button>

                  {/* Patient 1: Ramesh */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ramesh', 'Patient@123')}
                    className={`p-2.5 rounded-control text-left transition-all cursor-pointer ${
                      username === 'ramesh'
                        ? 'border border-[rgba(255,98,66,0.4)] border-l-4 border-l-[#FF6242] bg-[#FF6242]/10 shadow-[0_0_16px_rgba(255,98,66,0.25)]'
                        : 'border border-[rgba(255,98,66,0.18)] bg-[#0E0E0E] hover:bg-[#161616] hover:border-[rgba(255,98,66,0.35)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#F5F2ED]">Ramesh Kumar</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#FF6242]/50 text-[#FF6242] bg-[#FF6242]/10">
                        PATIENT
                      </span>
                    </div>
                    <p className="text-[10px] text-[#BDB8B0] font-mono truncate">ramesh / Patient@123</p>
                  </button>

                  {/* Patient 2: Sunitha */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('sunitha', 'Patient@123')}
                    className={`p-2.5 rounded-control text-left transition-all cursor-pointer sm:col-span-2 ${
                      username === 'sunitha'
                        ? 'border border-[rgba(255,98,66,0.4)] border-l-4 border-l-[#FF6242] bg-[#FF6242]/10 shadow-[0_0_16px_rgba(255,98,66,0.25)]'
                        : 'border border-[rgba(255,98,66,0.18)] bg-[#0E0E0E] hover:bg-[#161616] hover:border-[rgba(255,98,66,0.35)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#F5F2ED]">Sunitha Kmare</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#FF6242]/50 text-[#FF6242] bg-[#FF6242]/10">
                        PATIENT
                      </span>
                    </div>
                    <p className="text-[10px] text-[#BDB8B0] font-mono truncate">sunitha / Patient@123</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Hospital Trust Badge */}
            <div className="pt-6 border-t border-[rgba(255,98,66,0.22)] text-xs text-[#BDB8B0] flex items-center justify-between font-mono">
              <span>{t('auth.auditProtected', null, 'HIPAA Synthetic Compliant')}</span>
              <span className="text-[11px] text-[#FF9A62]">DPDP Act 2023 Ready</span>
            </div>
          </div>

          {/* Right Panel: Sign In / Registration Stepper (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-[#111111] overflow-y-auto">
            <div>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(255,98,66,0.22)]">
                <div className="flex items-center gap-1.5 bg-[#0E0E0E] p-1 rounded-control border border-[rgba(255,98,66,0.22)]">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setLoginError(null); }}
                    className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-[#FF6242] text-[#050505] shadow-glow-coral'
                        : 'text-[#BDB8B0] hover:text-[#F5F2ED]'
                    }`}
                  >
                    {t('auth.tabSignIn', null, 'Sign In')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setRegError(null); }}
                    className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      mode === 'register'
                        ? 'bg-[#FF6242] text-[#050505] shadow-glow-coral'
                        : 'text-[#BDB8B0] hover:text-[#F5F2ED]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('auth.tabRegister', null, 'Patient Registration')}</span>
                  </button>
                </div>

                {/* Interactive Language Selector */}
                <div className="flex items-center gap-1.5 bg-[#0E0E0E] px-2.5 py-1 rounded-control border border-[rgba(255,98,66,0.25)]">
                  <Globe className="w-3.5 h-3.5 text-[#FF6242] shrink-0" />
                  <select
                    value={settings.ui_language || 'en'}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono font-bold text-[#F5F2ED] focus:outline-none cursor-pointer"
                    aria-label="Select Interface Language"
                  >
                    {enabledLangs.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#050505] text-[#F5F2ED]">
                        {lang.native ? `${lang.native} (${lang.code.toUpperCase()})` : lang.code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ════════ MODE 1: SIGN IN ════════ */}
              {mode === 'login' && (
                <div>
                  <div className="mb-6">
                    <h4 className="font-syne font-bold text-2xl text-[#F5F2ED] tracking-tight">
                      {t('auth.signInTitle', null, 'Sign in to Coordinator')}
                    </h4>
                    <p className="text-xs text-[#BDB8B0] mt-1">
                      {t('auth.signInSubtitle', null, 'Enter your clinical credentials or patient mobile to access care coordination')}
                    </p>
                  </div>

                  {loginError && (
                    <div className="mb-5 p-3.5 rounded-control bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 text-[#FF4D5E] text-xs flex items-start gap-2.5 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{t('auth.errorNotice', null, 'Authentication Error')}</p>
                        <p className="mt-0.5">{loginError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#BDB8B0] mb-1.5 uppercase font-mono tracking-wide-mono" htmlFor="username">
                        {t('auth.usernameLabel', null, 'Username, Mobile or Email')}
                      </label>
                      <div className="relative rounded-control">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#BDB8B0]">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. operator, ramesh, +919876543210"
                          className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none transition-colors"
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#BDB8B0] mb-1.5 uppercase font-mono tracking-wide-mono" htmlFor="password">
                        {t('auth.passwordLabel', null, 'Password')}
                      </label>
                      <div className="relative rounded-control">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#BDB8B0]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="block w-full pl-10 pr-10 py-2.5 text-sm bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none transition-colors"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#BDB8B0] hover:text-[#F5F2ED] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[#BDB8B0] select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-[rgba(255,98,66,0.3)] bg-[#0E0E0E] text-[#FF6242] focus:ring-[#FF6242]"
                        />
                        <span>{t('auth.rememberMe', null, 'Keep session active (15-min timeout)')}</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loginSubmitting || loading}
                        className="w-full py-3 px-4 bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] font-bold text-sm rounded-control shadow-glow-coral flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {loginSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin"></div>
                            <span>{t('auth.signingIn', null, 'Verifying Credentials...')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t('auth.signInBtn', null, 'Sign In to Coordinator')}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setRegError(null); }}
                      className="text-xs text-[#BDB8B0] hover:text-[#F5F2ED] cursor-pointer"
                    >
                      {t('auth.newPatientPrompt', null, 'New patient?')}{' '}
                      <span className="underline text-[#FF6242] font-semibold">{t('auth.registerHere', null, 'Register your profile')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ════════ MODE 2: PATIENT REGISTRATION ════════ */}
              {mode === 'register' && (
                <div>
                  <div className="mb-4">
                    <h4 className="font-syne font-bold text-2xl text-[#F5F2ED] tracking-tight flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#FF6242]" />
                      <span>{t('register.title', null, 'Patient Care Registration')}</span>
                    </h4>
                    <p className="text-xs text-[#BDB8B0] mt-0.5">
                      {t('register.subtitle', null, 'Register once to coordinate discharge plans, medication schedules & clinical alerts')}
                    </p>
                  </div>

                  {/* Stepper Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#BDB8B0] mb-2 font-mono">
                      <span className={regStep >= 1 ? 'text-[#FF6242] font-bold' : 'text-[#BDB8B0]'}>
                        1. {t('register.step1', null, 'Account')}
                      </span>
                      <span className={regStep >= 2 ? 'text-[#FF6242] font-bold' : 'text-[#BDB8B0]'}>
                        2. {t('register.step2', null, 'Patient Details')}
                      </span>
                      <span className={regStep >= 3 ? 'text-[#FF6242] font-bold' : 'text-[#BDB8B0]'}>
                        3. {t('register.step3', null, 'Caregiver & Consent')}
                      </span>
                    </div>
                    <div className="w-full bg-[#0E0E0E] h-1.5 rounded-full overflow-hidden border border-[rgba(255,98,66,0.22)]">
                      <div
                        className="bg-[#FF6242] h-full transition-all duration-300"
                        style={{ width: `${(regStep / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {regError && (
                    <div className="mb-4 p-3 rounded-control bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 text-[#FF4D5E] text-xs flex items-start gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{t('auth.errorNotice', null, 'Registration Notice')}</p>
                        <p className="mt-0.5">{regError}</p>
                      </div>
                    </div>
                  )}

                  {/* STEP 1: ACCOUNT DETAILS */}
                  {regStep === 1 && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-username">
                          {t('register.username', null, 'Username')} *
                        </label>
                        <div className="relative rounded-control">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#BDB8B0]">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            id="reg-username"
                            type="text"
                            required
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            placeholder="e.g. anita_k"
                            className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-[#BDB8B0]/70 mt-0.5">
                          {t('register.usernameHelp', null, 'Minimum 3 characters')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-password">
                            {t('register.password', null, 'Password')} *
                          </label>
                          <div className="relative rounded-control">
                            <input
                              id="reg-password"
                              type={showRegPassword ? 'text' : 'password'}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#BDB8B0] hover:text-[#F5F2ED] cursor-pointer"
                            >
                              {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-confirm-pw">
                            {t('register.confirmPassword', null, 'Confirm Password')} *
                          </label>
                          <input
                            id="reg-confirm-pw"
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Password Strength Indicator */}
                      {regPassword && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#BDB8B0]">Strength:</span>
                            <span className="font-semibold text-[#F5F2ED]">{passwordStrength.label}</span>
                          </div>
                          <div className="w-full bg-[#0E0E0E] h-1.5 rounded-full overflow-hidden border border-[rgba(255,98,66,0.22)]">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all`}
                              style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-mobile">
                            {t('register.mobile', null, 'Mobile Number')} *
                          </label>
                          <div className="flex gap-2">
                            <div className="relative rounded-control flex-1">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#BDB8B0] text-xs font-mono font-semibold">
                                +91
                              </div>
                              <input
                                id="reg-mobile"
                                type="tel"
                                required
                                value={regMobile}
                                onChange={(e) => {
                                  setRegMobile(e.target.value);
                                  if (otpVerified) setOtpVerified(false);
                                }}
                                placeholder="9876543210"
                                className="block w-full pl-10 pr-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading || otpVerified}
                              className={`px-3 py-2 text-xs font-bold font-mono rounded-control whitespace-nowrap cursor-pointer transition-all ${
                                otpVerified
                                  ? 'bg-[#55D6A2]/20 text-[#55D6A2] border border-[#55D6A2]/40'
                                  : 'bg-[#FF6242] text-[#050505] hover:bg-[#FF7B60]'
                              }`}
                            >
                              {otpLoading ? 'Sending...' : otpVerified ? '✓ Verified' : otpSent ? 'Resend' : 'Send OTP'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-email">
                            {t('register.email', null, 'Email Address')}
                          </label>
                          <div className="relative rounded-control">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#BDB8B0]">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <input
                              id="reg-email"
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="patient@example.com"
                              className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* OTP Verification Box */}
                      {otpSent && !otpVerified && (
                        <div className="p-3 bg-[#0E0E0E] rounded-control border border-[rgba(255,98,66,0.3)] space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[#F5F2ED] font-semibold flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#FF6242]" />
                              Enter Verification OTP
                            </span>
                            <span className="font-mono text-[11px] text-[#55D6A2] bg-[#55D6A2]/10 px-2 py-0.5 rounded border border-[#55D6A2]/30">
                              Demo Code: {demoOtp || '1234'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="4-digit OTP"
                              className="flex-1 px-3 py-1.5 text-xs font-mono font-bold tracking-widest bg-[#050505] text-[#F5F2ED] border border-[rgba(255,98,66,0.25)] rounded-control focus:border-[#FF6242] focus:outline-none text-center"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={otpLoading}
                              className="px-4 py-1.5 bg-[#55D6A2] text-[#050505] hover:bg-[#6FE0B2] text-xs font-bold font-mono rounded-control cursor-pointer transition-all"
                            >
                              {otpLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          </div>
                          {otpNotice && (
                            <p className="text-[11px] text-[#55D6A2] font-mono">{otpNotice}</p>
                          )}
                        </div>
                      )}

                      {otpVerified && (
                        <div className="p-2.5 bg-[#55D6A2]/10 border border-[#55D6A2]/30 rounded-control flex items-center gap-2 text-xs text-[#55D6A2] font-mono font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-[#55D6A2]" />
                          <span>Mobile number verified (+91 {regMobile})</span>
                        </div>
                      )}

                      {/* Preferred Language Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-pref-lang">
                          {t('register.language', null, 'Preferred Care Language')}
                        </label>
                        <div className="relative rounded-control">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#FF6242]">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <select
                            id="reg-pref-lang"
                            value={regPrefLang}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none cursor-pointer font-medium"
                          >
                            {enabledLangs.map((lang) => (
                              <option key={lang.code} value={lang.code} className="bg-[#050505] text-[#F5F2ED]">
                                {lang.native ? `${lang.native} — ${lang.name}` : lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[10px] text-[#BDB8B0]/70 mt-0.5">
                          Care plans and reminders will be translated into this language.
                        </p>
                      </div>

                      <div className="pt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleStep1Next}
                          className="px-5 py-2.5 bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] text-xs font-bold rounded-control flex items-center gap-2 shadow-glow-coral cursor-pointer"
                        >
                          <span>{t('register.nextBtn', null, 'Next: Patient Details')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PATIENT DETAILS */}
                  {regStep === 2 && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-full-name">
                            {t('register.fullName', null, 'Full Patient Name')} *
                          </label>
                          <input
                            id="reg-full-name"
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-uhid">
                            {t('register.uhid', null, 'Hospital UHID / MRN')}
                          </label>
                          <input
                            id="reg-uhid"
                            type="text"
                            value={regUhid}
                            onChange={(e) => setRegUhid(e.target.value)}
                            placeholder="UHID-2026-9041"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 font-mono focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-dob">
                            {t('register.dob', null, 'DOB')}
                          </label>
                          <input
                            id="reg-dob"
                            type="date"
                            value={regDob}
                            onChange={handleDobChange}
                            className="block w-full px-2.5 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-age">
                            {t('register.age', null, 'Age')} *
                          </label>
                          <input
                            id="reg-age"
                            type="number"
                            min="1"
                            max="120"
                            required
                            value={regAge}
                            onChange={(e) => setRegAge(e.target.value)}
                            placeholder="58"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-sex">
                            {t('register.sex', null, 'Sex')}
                          </label>
                          <select
                            id="reg-sex"
                            value={regSex}
                            onChange={(e) => setRegSex(e.target.value)}
                            className="block w-full px-2.5 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none cursor-pointer"
                          >
                            <option value="Male" className="bg-[#050505] text-[#F5F2ED]">Male</option>
                            <option value="Female" className="bg-[#050505] text-[#F5F2ED]">Female</option>
                            <option value="Other" className="bg-[#050505] text-[#F5F2ED]">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Allergies Tag Input */}
                      <div>
                        <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase">
                          {t('register.allergies', null, 'Known Drug/Food Allergies')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={allergyInput}
                            onChange={(e) => setAllergyInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                            placeholder="e.g. Penicillin, Sulfa"
                            className="block flex-1 px-3 py-1.5 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => addAllergy()}
                            className="px-3 py-1.5 bg-[#161616] border border-[rgba(255,98,66,0.22)] text-xs rounded-control hover:bg-[#202020] text-[#F5F2ED] cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        {allergiesList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {allergiesList.map((al, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/30">
                                <span>{al}</span>
                                <button type="button" onClick={() => removeAllergy(idx)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Navigation buttons */}
                      <div className="pt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="px-4 py-2 border border-[rgba(255,98,66,0.22)] hover:bg-[#161616] text-[#BDB8B0] hover:text-[#F5F2ED] text-xs font-semibold rounded-control flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>{t('register.backBtn', null, 'Back')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleStep2Next}
                          className="px-5 py-2 bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] text-xs font-bold rounded-control flex items-center gap-2 shadow-glow-coral cursor-pointer"
                        >
                          <span>Next: Caregiver & Consent</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: CAREGIVER & CONSENTS */}
                  {regStep === 3 && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-cg-name">
                            Caregiver Name
                          </label>
                          <input
                            id="reg-cg-name"
                            type="text"
                            value={caregiverName}
                            onChange={(e) => setCaregiverName(e.target.value)}
                            placeholder="e.g. Sunita Kumar"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#BDB8B0] mb-1 font-mono uppercase" htmlFor="reg-cg-mobile">
                            Caregiver Mobile
                          </label>
                          <input
                            id="reg-cg-mobile"
                            type="tel"
                            value={caregiverMobile}
                            onChange={(e) => setCaregiverMobile(e.target.value)}
                            placeholder="9845012345"
                            className="block w-full px-3 py-2 text-xs bg-[#0E0E0E] text-[#F5F2ED] border border-[rgba(255,98,66,0.22)] rounded-control placeholder:text-[#BDB8B0]/40 focus:border-[#FF6242] focus:ring-1 focus:ring-[#FF6242] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Consents */}
                      <div className="space-y-2.5 pt-2 border-t border-[rgba(255,98,66,0.22)]">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#BDB8B0] select-none">
                          <input
                            type="checkbox"
                            checked={consentDpdp}
                            onChange={(e) => setConsentDpdp(e.target.checked)}
                            className="mt-0.5 rounded border-[rgba(255,98,66,0.3)] bg-[#0E0E0E] text-[#FF6242] focus:ring-[#FF6242]"
                          />
                          <span>
                            I consent to DPDP Act 2023 compliant data minimization and automated discharge plan coordination.
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#BDB8B0] select-none">
                          <input
                            type="checkbox"
                            checked={consentReminders}
                            onChange={(e) => setConsentReminders(e.target.checked)}
                            className="mt-0.5 rounded border-[rgba(255,98,66,0.3)] bg-[#0E0E0E] text-[#FF6242] focus:ring-[#FF6242]"
                          />
                          <span>
                            I agree to receive scheduled in-app medication chimes and browser adherence alerts.
                          </span>
                        </label>
                      </div>

                      {/* Submit buttons */}
                      <div className="pt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setRegStep(2)}
                          className="px-4 py-2 border border-[rgba(255,98,66,0.22)] hover:bg-[#161616] text-[#BDB8B0] hover:text-[#F5F2ED] text-xs font-semibold rounded-control flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>{t('register.backBtn', null, 'Back')}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={regSubmitting}
                          className="px-6 py-2.5 bg-[#FF6242] hover:bg-[#FF7B60] text-[#050505] text-xs font-bold rounded-control flex items-center gap-2 shadow-glow-coral cursor-pointer disabled:opacity-50"
                        >
                          {regSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin"></div>
                              <span>Registering...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete Registration & Sign In</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ RESTRAINED FOOTER ════════ */}
      <footer className="w-full border-t border-[rgba(255,98,66,0.22)] py-8 text-center text-xs text-[#BDB8B0] font-mono bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CareBridge Coordinator. Open clinical coordination protocol.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>DPDP ACT 2023 COMPLIANT</span>
            <span>•</span>
            <span>CLAUDE SONNET 4.6</span>
            <span>•</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
