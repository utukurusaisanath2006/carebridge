import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Sparkles,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Clock,
  ArrowRight,
  ShieldAlert,
  Edit3,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function PatientWelcome({ onNavigate, plan = null }) {
  const { user, patientProfile } = useAuth();
  const { t } = useSettings();

  const name = patientProfile?.full_name || user?.name || 'Patient';
  const uhid = patientProfile?.uhid || 'UHID-PENDING';
  const age = patientProfile?.age || 58;
  const sex = patientProfile?.sex || 'Male';
  const allergies = patientProfile?.allergies || [];
  const conditions = patientProfile?.chronic_conditions || [];
  const medicines = patientProfile?.current_medicines || [];
  const caregiver = patientProfile?.caregiver;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="glass-card border border-[var(--border-strong)] text-[var(--text)] rounded-3xl p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#121217] via-[#0d0d12] to-[#050505]">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[var(--accent-2)]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[#FF6242]/30 text-xs font-mono font-semibold text-[#FF9A62]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF9A62]" />
            <span>DPDP Act 2023 Verified • Patient Care Portal</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-[var(--text)]">
            {t('patientPortal.welcomeTitle', { name }, `Hello ${name}, let's set up your care plan`)}
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
            {t('patientPortal.welcomeSubtitle', null, 'Your registered clinical profile is active. Ready to ingest and coordinate your hospital discharge instructions with closed-loop safety cross-checks.')}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('intake')}
              className="min-h-[44px] px-6 py-2.5 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(255,98,66,0.3)] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
            >
              <FileText className="w-4 h-4 text-[#050505]" />
              <span>{t('patientPortal.startIntakeBtn', null, 'Start Discharge Intake')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {plan && (
              <button
                type="button"
                onClick={() => onNavigate('plan')}
                className="min-h-[44px] px-5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-bold rounded-xl border border-[var(--border)] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
              >
                <span>View Existing Plan</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-2)]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="min-h-[44px] px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-xs font-bold rounded-xl border border-[var(--border)] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{t('patientPortal.viewProfileBtn', null, 'View / Edit Profile')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
        <ShieldCheck className="w-5 h-5 text-[var(--accent-2)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text)]">
          <strong className="block font-bold mb-0.5 text-[var(--accent-2)] font-mono uppercase tracking-wider">Automated Safety Cross-Checks Enabled</strong>
          <span className="text-[var(--text-muted)]">{t('patientPortal.safetyNotice', null, 'Every medication and instruction in your discharge summary will be checked against your known allergies and current home medications to prevent dangerous interactions or accidental duplicate dosing.')}</span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,98,66,0.15)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[var(--text)]">
                {t('patientPortal.profileOverview', null, 'Your Registered Health Profile')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {uhid} • {age} yrs, {sex}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-xs text-[var(--accent)] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Allergies Card */}
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--critical)]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--critical)] font-mono uppercase tracking-wider text-[11px]">
                <AlertTriangle className="w-4 h-4 text-[var(--critical)]" />
                <span>Known Allergies</span>
              </span>
              <span className="text-[10px] bg-[var(--critical)]/20 text-[var(--critical)] px-2 py-0.5 rounded font-mono font-bold">
                {allergies.length}
              </span>
            </div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allergies.map((a, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 bg-[var(--critical)]/15 border border-[var(--critical)]/30 text-[var(--critical)] rounded-lg">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-faint)] italic">No drug allergies recorded.</p>
            )}
          </div>

          {/* Conditions Card */}
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--accent)] font-mono uppercase tracking-wider text-[11px]">
                <Heart className="w-4 h-4 text-[var(--accent)]" />
                <span>Chronic Conditions</span>
              </span>
              <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded font-mono font-bold">
                {conditions.length}
              </span>
            </div>
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {conditions.map((c, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-faint)] italic">No chronic conditions listed.</p>
            )}
          </div>

          {/* Current Medicines Card */}
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--accent-2)]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--accent-2)] font-mono uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-2)]" />
                <span>Home Medications</span>
              </span>
              <span className="text-[10px] bg-[var(--accent-2)]/20 text-[var(--accent-2)] px-2 py-0.5 rounded font-mono font-bold">
                {medicines.length}
              </span>
            </div>
            {medicines.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {medicines.map((m, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 bg-[var(--accent-2)]/15 border border-[var(--accent-2)]/30 text-[var(--accent-2)] rounded-lg">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-faint)] italic">No current home medications listed.</p>
            )}
          </div>
        </div>

        {/* Caregiver & Reminder Times Footer */}
        <div className="bg-[var(--surface)] p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--text-faint)]" />
            <span>
              <strong className="text-[var(--text)]">Caregiver:</strong>{' '}
              {caregiver?.name ? `${caregiver.name} (${caregiver.relationship || 'Family'})` : 'None nominated'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-faint)]" />
            <span>
              <strong className="text-[var(--text)]">Reminder Slots:</strong> Morning, Afternoon, Evening, Night
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
