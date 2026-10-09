import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Camera,
  Database,
  ArrowRight,
  Languages
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../utils/i18nHelpers';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function IntakePanel({
  onAnalyzeComplete,
  loading,
  setLoading,
  onOpenSettings,
  patientContext = null
}) {
  const { settings, supportedLanguages, t } = useSettings();
  const { authFetch, patientProfile } = useAuth();
  const activePatient = patientContext || patientProfile;
  const currentLang = settings.ui_language || 'en';
  const [activeTab, setActiveTab] = useState('text'); // 'pdf' | 'image' | 'text' | 'dictate'
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [filePageCount, setFilePageCount] = useState(1);
  const [extractedText, setExtractedText] = useState('');
  const [showVerifyStep, setShowVerifyStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dictationPrompt, setDictationPrompt] = useState('');
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const extraLangs = (settings.enabled_languages || []).filter(l => l !== 'en');
  const langNames = extraLangs.map(code => supportedLanguages.find(l => l.code === code)?.name || code);
  const displayLanguagesString = extraLangs.length === 0
    ? t('intake.langDefaultEnglish', null, 'English (Default)')
    : t('intake.langEnglishPlus', { languages: langNames.join(', ') }, `English + ${langNames.join(', ')}`);

  // Localized analysis step messages
  const analysisSteps = [
    t('intake.stepReading', null, 'Reading discharge document & extracting clinical instructions...'),
    t('intake.stepSimplifying', null, 'Simplifying medical jargon to Grade-6 plain English...'),
    extraLangs.length > 0
      ? t('intake.stepTranslating', { languages: langNames.join(', ') }, `Generating targeted regional translations (${langNames.join(', ')})...`)
      : t('intake.stepVerifying', null, 'Applying patient safety & single-language verification (zero translation overhead)...'),
    t('intake.stepScheduling', null, 'Building structured medication schedules & checking drug safety rules...')
  ];

  useEffect(() => {
    let interval = null;
    if (loading) {
      setAnalysisStepIndex(0);
      interval = setInterval(() => {
        setAnalysisStepIndex((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, analysisSteps.length]);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setDictationPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg(t('intake.errSpeechNotSupported', null, 'Web Speech API is not supported in this browser. Please type your dictation.'));
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Load preset sample
  const handleLoadSample = async (type = 'diabetes') => {
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/sample?type=${type}`);
      if (!res.ok) throw new Error(t('intake.errLoadSample', null, 'Failed to load sample'));
      const data = await res.json();
      setPastedText(data.discharge_text);
      setExtractedText(data.discharge_text);
      setShowVerifyStep(true);
    } catch (err) {
      setErrorMsg(t('intake.errSampleBackend', null, 'Could not fetch sample. Make sure backend is running.'));
    }
  };

  // File selection & 10MB validation
  const handleFileChange = async (file) => {
    if (!file) return;
    setErrorMsg(null);

    // 10MB check
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(t('intake.errFileSize', null, 'File exceeds 10MB size limit. Please choose a smaller file.'));
      return;
    }

    setSelectedFile(file);

    // Image preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Automatically call /api/extract-text so user can verify before final plan generation
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || t('intake.errExtractFailed', null, 'Failed to extract text from file.'));
      }

      const data = await res.json();
      setExtractedText(data.extracted_text);
      setFilePageCount(data.page_count || 1);
      setShowVerifyStep(true);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Proceed to verify step for pasted text or prompt
  const handlePrepareTextForVerification = () => {
    const text = activeTab === 'dictate' ? dictationPrompt : pastedText;
    if (!text.trim()) {
      setErrorMsg(t('intake.errEmptyText', null, 'Please enter or dictate discharge text first.'));
      return;
    }
    setErrorMsg(null);
    setExtractedText(text.trim());
    setShowVerifyStep(true);
  };

  // Final analyze execution
  const handleExecuteAnalysis = async () => {
    if (!extractedText.trim()) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = {
        discharge_text: extractedText.trim(),
        languages: settings.enabled_languages,
        force_refresh: true,
      };

      if (activePatient) {
        payload.patient_context = {
          full_name: activePatient.full_name,
          uhid: activePatient.uhid,
          age: activePatient.age,
          sex: activePatient.sex,
          allergies: activePatient.allergies || [],
          chronic_conditions: activePatient.chronic_conditions || [],
          current_medicines: activePatient.current_medicines || [],
          preferred_language: activePatient.preferred_language || settings.ui_language || 'en'
        };
      }

      const res = await authFetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || t('intake.errAnalysisFailed', null, 'Analysis pipeline failed.'));
      }

      const plan = await res.json();
      onAnalyzeComplete(plan);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-[var(--border)] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Active Registered Patient Banner (if present) */}
      {activePatient && (
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[var(--accent-2)]/30 bg-[var(--accent-2)]/10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-2)] text-[#050505] flex items-center justify-center font-display font-extrabold text-base shrink-0 shadow-[0_0_15px_rgba(85,214,162,0.35)]">
              {activePatient.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-[var(--text)]">{activePatient.full_name}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium tracking-wider bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
                  {activePatient.uhid || 'UHID'}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {activePatient.age} yrs • {activePatient.sex}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                <strong className="text-[var(--text)] font-semibold">Safety Verification:</strong> Cross-referencing against {activePatient.allergies?.length || 0} allergies and {activePatient.current_medicines?.length || 0} home medications.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono tracking-wider font-bold text-[var(--accent-2)] bg-[var(--surface-2)] px-3 py-1.5 rounded-xl border border-[var(--accent-2)]/30 shrink-0">
            PROFILE ATTACHED
          </span>
        </div>
      )}

      {/* Header with Title and Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[var(--border)] gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight">
              {t('intake.title', null, 'New Discharge Intake')}
            </h2>
            <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
              {t('intake.badge', null, 'Multi-Format Engine')}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('intake.subtitle', null, 'Ingest hospital discharge summaries via PDF, Image / Camera, Text, or Voice Dictation.')}
          </p>
        </div>

        {/* Demo Preset Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" /> {t('intake.presetsLabel', null, 'Demo Cases:')}
          </span>
          <button
            type="button"
            onClick={() => handleLoadSample('diabetes')}
            disabled={loading}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
          >
            {t('intake.sampleDiabetes', null, 'Ramesh Kumar (Diabetes)')}
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('cardiac')}
            disabled={loading}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
          >
            {t('intake.sampleCardiac', null, 'Sunita Patel (Cardiac)')}
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('pediatric')}
            disabled={loading}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
          >
            {t('intake.samplePediatric', null, 'Aarav Sharma (Pediatric)')}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 rounded-xl text-[var(--text)] text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--critical)] shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* STEP 1: Choose Mode & Ingest */}
      {!showVerifyStep ? (
        <div className="space-y-6">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
                activeTab === 'pdf'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Upload className="w-4 h-4 text-[var(--accent)]" />
              <span>{t('intake.tabPdf', null, 'Upload PDF')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
                activeTab === 'image'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[var(--accent)]" />
              <span>{t('intake.tabImage', null, 'Upload Image')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
                activeTab === 'text'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <FileText className="w-4 h-4 text-[var(--accent)]" />
              <span>{t('intake.tabText', null, 'Paste Text')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dictate')}
              className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] ${
                activeTab === 'dictate'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Mic className="w-4 h-4 text-[var(--accent)]" />
              <span>{t('intake.tabDictate', null, 'Prompt / Dictate')}</span>
            </button>
          </div>

          {/* TAB 1: PDF Dropzone */}
          {activeTab === 'pdf' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] rounded-2xl p-10 text-center bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-all cursor-pointer space-y-3 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center mx-auto border border-[var(--border)] group-hover:scale-105 group-hover:border-[var(--accent)] transition-all shadow-[0_0_20px_rgba(255,98,66,0.15)]">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--text)]">
                  {t('intake.pdfDropTitle', null, 'Click to upload or drag and drop discharge PDF')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t('intake.pdfDropSub', null, 'Text PDFs & scanned documents supported (Max size: 10MB)')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Image / Mobile Camera */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] rounded-2xl p-10 text-center bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-all cursor-pointer space-y-3 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center mx-auto border border-[var(--border)] group-hover:scale-105 group-hover:border-[var(--accent)] transition-all shadow-[0_0_20px_rgba(255,98,66,0.15)]">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--text)]">
                    {t('intake.imgDropTitle', null, 'Click to select image or drag and drop (JPG, PNG, WEBP)')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {t('intake.imgDropSub', null, 'Processed via Claude Vision for printed and handwritten summaries')}
                  </p>
                </div>
              </div>

              {/* Mobile Camera Option */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-[44px] inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
                >
                  <Camera className="w-4 h-4 text-[var(--accent)]" />
                  <span>{t('intake.captureCamera', null, 'Capture with Mobile Camera')}</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Paste Text */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder={t('intake.textPlaceholder', null, 'Paste unformatted clinical discharge summary here...')}
                className="w-full p-4 text-sm font-mono text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 placeholder-[var(--text-faint)] transition-all resize-y leading-relaxed"
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="font-mono">{t('intake.charCount', { count: formatNumber(pastedText.length, currentLang) }, `${pastedText.length} characters`)}</span>
                <button
                  type="button"
                  onClick={handlePrepareTextForVerification}
                  disabled={!pastedText.trim()}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(255,98,66,0.25)]"
                >
                  <span>{t('intake.verifyTextBtn', null, 'Verify Text')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Prompt / Voice Dictation */}
          {activeTab === 'dictate' && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={dictationPrompt}
                  onChange={(e) => setDictationPrompt(e.target.value)}
                  rows={6}
                  placeholder={t('intake.dictatePlaceholder', null, "Type or dictate free-text: e.g. '58 year old diabetic discharged today, Metformin twice daily after meals, review with endocrinologist in 7 days...'")}
                  className="w-full p-4 pr-16 text-sm text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 placeholder-[var(--text-faint)] transition-all resize-y leading-relaxed"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`absolute top-3.5 right-3.5 p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    isRecording
                      ? 'bg-[var(--critical)] text-white animate-pulse shadow-[0_0_25px_rgba(255,77,94,0.4)]'
                      : 'bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  }`}
                  title={isRecording ? t('intake.stopRecording', null, 'Stop Recording') : t('intake.startRecording', null, 'Start Voice Dictation')}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[var(--accent)]" />}
                </button>
              </div>

              {isRecording && (
                <div className="p-3.5 bg-[var(--critical)]/15 border border-[var(--critical)]/30 rounded-xl text-[var(--text)] text-xs flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--critical)] animate-ping"></span>
                  <span className="font-medium">{t('intake.listeningText', null, 'Listening... Speak discharge orders clearly into your microphone.')}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="font-mono uppercase tracking-wider">{t('intake.promptModeLabel', null, 'Free-text / Voice Prompt mode')}</span>
                <button
                  type="button"
                  onClick={handlePrepareTextForVerification}
                  disabled={!dictationPrompt.trim()}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(255,98,66,0.25)]"
                >
                  <span>{t('intake.verifyPromptBtn', null, 'Verify Prompt')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Operator Language Indicator Chip */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl mt-4">
            <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
              <Languages className="w-4 h-4 text-[var(--accent)]" />
              <span>
                <strong className="text-[var(--text)] font-semibold">{t('intake.outputLanguages', null, 'Output languages')}:</strong> {displayLanguagesString}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs font-mono tracking-wider font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              {t('intake.changeBtn', null, 'Change')}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Editable 'Extracted text – please verify' Step */
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 bg-[var(--accent-2)]/10 border-l-4 border-l-[var(--accent-2)] border border-[var(--accent-2)]/30 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-[var(--accent-2)] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--accent-2)]">
                  {t('intake.verifyStepTitle', null, 'Extracted text – please verify before analysis')}
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t('intake.verifyStepSub', null, 'You can edit names, dosages, or instructions below before running the AI Agent coordinator.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVerifyStep(false)}
              className="text-xs font-mono tracking-wider font-semibold text-[var(--accent-2)] hover:underline cursor-pointer shrink-0"
            >
              {t('intake.changeInputBtn', null, 'Change Input')}
            </button>
          </div>

          {/* File Preview if Image or PDF */}
          {filePreview && (
            <div className="border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)] flex items-center gap-4">
              <img
                src={filePreview}
                alt="Upload preview"
                className="w-16 h-20 object-cover rounded-lg border border-[var(--border)] shadow-sm"
              />
              <div className="text-xs text-[var(--text-muted)]">
                <strong className="text-[var(--text)]">{t('intake.uploadedDocLabel', null, 'Uploaded Document:')}</strong> {selectedFile?.name}
                <div className="text-[11px] text-[var(--text-faint)] font-mono mt-0.5">
                  {formatNumber((selectedFile?.size / 1024).toFixed(1), currentLang)} KB • {t('intake.imageOcrReady', null, 'Image OCR Ready')}
                </div>
              </div>
            </div>
          )}

          {/* Editable verification textarea */}
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            disabled={loading}
            rows={10}
            className="w-full p-4 text-xs font-mono text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs font-mono text-[var(--text-faint)]">
              {t('intake.readyForModel', { count: formatNumber(extractedText.length, currentLang) }, `${extractedText.length} characters • Ready for Claude claude-sonnet-4-6`)}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowVerifyStep(false)}
                disabled={loading}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
              >
                {t('intake.backBtn', null, 'Back')}
              </button>

              <button
                type="button"
                onClick={handleExecuteAnalysis}
                disabled={loading || !extractedText.trim()}
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#050505] bg-[var(--accent)] hover:bg-[#ff7559] shadow-[0_0_25px_rgba(255,98,66,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('intake.processingPlanBtn', null, 'Processing Plan...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('intake.runAiCoordinatorBtn', null, 'Run AI Agent Coordination')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Multi-step progress animation during analysis */}
          {loading && (
            <div className="mt-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3">
              <div className="flex items-center gap-3 text-xs font-mono font-bold text-[var(--accent-2)]">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-2)]" />
                <span>{t('intake.pipelineActiveStep', { current: formatNumber(analysisStepIndex + 1, currentLang), total: formatNumber(analysisSteps.length, currentLang) }, `AI Pipeline Active: Step ${analysisStepIndex + 1} of ${analysisSteps.length}`)}</span>
              </div>

              <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[var(--accent-2)] h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(85,214,162,0.5)]"
                  style={{ width: `${((analysisStepIndex + 1) / analysisSteps.length) * 100}%` }}
                />
              </div>

              <div className="text-xs text-[var(--text-muted)] font-medium">
                {analysisSteps[analysisStepIndex]}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
