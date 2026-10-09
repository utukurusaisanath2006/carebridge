import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Clock,
  Save,
  Trash2,
  Key,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';

export default function PatientProfileView({ onNavigate }) {
  const { user, patientProfile, updatePatientProfile, deletePatientData, changePassword } = useAuth();
  const { settings, supportedLanguages, t } = useSettings();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [uhid, setUhid] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState('en');

  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');

  const [conditions, setConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');

  const [medicines, setMedicines] = useState([]);
  const [medicineInput, setMedicineInput] = useState('');

  const [morningTime, setMorningTime] = useState('08:00');
  const [afternoonTime, setAfternoonTime] = useState('13:00');
  const [eveningTime, setEveningTime] = useState('18:00');
  const [nightTime, setNightTime] = useState('21:00');

  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRelation, setCaregiverRelation] = useState('Family');
  const [caregiverMobile, setCaregiverMobile] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Change Password state
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState(null);

  // Delete Data Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Populate from patientProfile on load
  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.full_name || '');
      setAge(patientProfile.age ? String(patientProfile.age) : '');
      setSex(patientProfile.sex || 'Male');
      setUhid(patientProfile.uhid || '');
      setMobile(patientProfile.mobile || '');
      setEmail(patientProfile.email || '');
      setPreferredLang(patientProfile.preferred_language || 'en');
      setAllergies(patientProfile.allergies || []);
      setConditions(patientProfile.chronic_conditions || []);
      setMedicines(patientProfile.current_medicines || []);

      if (patientProfile.reminder_times) {
        setMorningTime(patientProfile.reminder_times.morning || '08:00');
        setAfternoonTime(patientProfile.reminder_times.afternoon || '13:00');
        setEveningTime(patientProfile.reminder_times.evening || '18:00');
        setNightTime(patientProfile.reminder_times.night || '21:00');
      }

      if (patientProfile.caregiver) {
        setCaregiverName(patientProfile.caregiver.name || '');
        setCaregiverRelation(patientProfile.caregiver.relationship || 'Family');
        setCaregiverMobile(patientProfile.caregiver.mobile || '');
      }
    } else if (user) {
      setFullName(user.name || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
    }
  }, [patientProfile, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updates = {
        full_name: fullName.trim(),
        age: parseInt(age, 10) || null,
        sex,
        uhid: uhid.trim() || null,
        mobile: mobile.trim() || null,
        email: email.trim() || null,
        preferred_language: preferredLang,
        allergies,
        chronic_conditions: conditions,
        current_medicines: medicines,
        reminder_times: {
          morning: morningTime,
          afternoon: afternoonTime,
          evening: eveningTime,
          night: nightTime
        },
        caregiver: caregiverName.trim()
          ? {
              name: caregiverName.trim(),
              relationship: caregiverRelation.trim() || 'Family',
              mobile: caregiverMobile.trim() || null
            }
          : null
      };

      await updatePatientProfile(updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPw || !newPw) return;
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(false);

    try {
      await changePassword(oldPw, newPw);
      setPwSuccess(true);
      setOldPw('');
      setNewPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteData = async () => {
    setDeleting(true);
    try {
      await deletePatientData();
      // AuthContext.logout will trigger and return to login screen
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const addTag = (type, val) => {
    if (type === 'allergy') {
      const v = (val || allergyInput).trim();
      if (v && !allergies.includes(v)) setAllergies([...allergies, v]);
      setAllergyInput('');
    } else if (type === 'condition') {
      const v = (val || conditionInput).trim();
      if (v && !conditions.includes(v)) setConditions([...conditions, v]);
      setConditionInput('');
    } else if (type === 'medicine') {
      const v = (val || medicineInput).trim();
      if (v && !medicines.includes(v)) setMedicines([...medicines, v]);
      setMedicineInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
            <User className="w-6 h-6 text-[var(--accent)]" />
            <span>{t('patientPortal.myProfile', null, 'My Patient Profile')}</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t('patientPortal.myProfileSub', null, 'Review and update your demographic details, health records and DPDP Act consent.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="min-h-[40px] px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-semibold rounded-xl border border-[var(--border)] flex items-center gap-2 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--accent)]" />
          <span>Back</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 text-[var(--accent-2)] text-xs font-bold flex items-center gap-2.5 shadow-md">
          <CheckCircle className="w-4 h-4 text-[var(--accent-2)]" />
          <span>{t('patientPortal.profileSaved', null, 'Patient profile updated successfully!')}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 text-[var(--critical)] text-xs font-bold flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-[var(--critical)]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="glass-card rounded-2xl border border-[var(--border)] p-6 space-y-5 shadow-2xl">
          <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
            1. Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Age</label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Hospital UHID</label>
              <input
                type="text"
                value={uhid}
                onChange={(e) => setUhid(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Mobile</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Preferred Language</label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Details */}
        <div className="glass-card rounded-2xl border border-[var(--border)] p-6 space-y-5 shadow-2xl">
          <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
            2. Clinical Profile & Allergies
          </h3>

          {/* Allergies */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Known Allergies</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('allergy'); } }}
                placeholder="Type and press Enter"
                className="flex-1 text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none placeholder-[var(--text-faint)]"
              />
              <button
                type="button"
                onClick={() => addTag('allergy')}
                className="min-h-[44px] px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a, i) => (
                <span key={i} className="text-xs font-bold px-3 py-1 bg-[var(--critical)]/15 border border-[var(--critical)]/30 text-[var(--critical)] rounded-lg flex items-center gap-1.5">
                  {a}
                  <button type="button" onClick={() => setAllergies(allergies.filter((_, idx) => idx !== i))} className="text-[var(--critical)] hover:opacity-80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Chronic Health Conditions</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('condition'); } }}
                placeholder="e.g. Hypertension, Type 2 Diabetes"
                className="flex-1 text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none placeholder-[var(--text-faint)]"
              />
              <button
                type="button"
                onClick={() => addTag('condition')}
                className="min-h-[44px] px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c, i) => (
                <span key={i} className="text-xs font-bold px-3 py-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-lg flex items-center gap-1.5">
                  {c}
                  <button type="button" onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Current Home Medications */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Current Home Medications</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('medicine'); } }}
                placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                className="flex-1 text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none placeholder-[var(--text-faint)]"
              />
              <button
                type="button"
                onClick={() => addTag('medicine')}
                className="min-h-[44px] px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] rounded-xl border border-[var(--border)] text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicines.map((m, i) => (
                <span key={i} className="text-xs font-bold px-3 py-1 bg-[var(--accent-2)]/15 border border-[var(--accent-2)]/30 text-[var(--accent-2)] rounded-lg flex items-center gap-1.5">
                  {m}
                  <button type="button" onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))} className="text-[var(--accent-2)] hover:opacity-80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Reminder Times */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-2">Preferred Daily Reminder Windows</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[11px] font-mono text-[var(--text-faint)]">Morning</span>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[var(--text-faint)]">Afternoon</span>
                <input
                  type="time"
                  value={afternoonTime}
                  onChange={(e) => setAfternoonTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[var(--text-faint)]">Evening</span>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[var(--text-faint)]">Night</span>
                <input
                  type="time"
                  value={nightTime}
                  onChange={(e) => setNightTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Caregiver */}
        <div className="glass-card rounded-2xl border border-[var(--border)] p-6 space-y-5 shadow-2xl">
          <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
            3. Nominated Caregiver
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Caregiver Name</label>
              <input
                type="text"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="e.g. Sunita Kumar"
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none placeholder-[var(--text-faint)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Relationship</label>
              <select
                value={caregiverRelation}
                onChange={(e) => setCaregiverRelation(e.target.value)}
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none"
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Parent">Parent</option>
                <option value="Family">Family / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Caregiver Mobile</label>
              <input
                type="tel"
                value={caregiverMobile}
                onChange={(e) => setCaregiverMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] font-mono focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 outline-none placeholder-[var(--text-faint)]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-6 py-2.5 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] text-xs font-bold rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(255,98,66,0.3)] cursor-pointer disabled:opacity-60 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('patientPortal.saving', null, 'Saving...') : t('patientPortal.saveChanges', null, 'Save Profile Changes')}</span>
          </button>
        </div>
      </form>

      {/* Security: Change Password */}
      <div className="glass-card rounded-2xl border border-[var(--border)] p-6 space-y-5 shadow-2xl">
        <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Key className="w-4 h-4 text-[var(--accent)]" />
          <span>Security: Change Password</span>
        </h3>

        {pwSuccess && (
          <div className="p-3.5 rounded-xl bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 text-[var(--accent-2)] text-xs font-bold">
            Password updated successfully!
          </div>
        )}

        {pwError && (
          <div className="p-3.5 rounded-xl bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 text-[var(--critical)] text-xs font-bold">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] outline-none focus:border-[var(--accent-2)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[var(--text-muted)] mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full text-xs p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] outline-none focus:border-[var(--accent-2)]"
            />
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="min-h-[44px] py-2.5 px-5 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-xs font-bold rounded-xl cursor-pointer disabled:opacity-60 transition-all"
          >
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* DPDP Act: Delete Data & Account */}
      <div className="rounded-2xl border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 bg-[var(--critical)]/10 p-6 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[var(--critical)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-mono uppercase tracking-wider font-bold text-[var(--critical)]">
              {t('patientPortal.deleteDataTitle', null, 'Privacy Rights & Data Deletion (DPDP Act)')}
            </h4>
            <p className="text-xs text-[var(--text)] mt-1.5 leading-relaxed font-medium">
              {t('patientPortal.deleteDataDesc', null, 'Under the Digital Personal Data Protection Act 2023, you have the right to erase all your personal and clinical records. Deleting your profile will immediately destroy your account credentials, clinical notes, and discharge schedules.')}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="min-h-[44px] px-5 py-2.5 bg-[var(--critical)] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(255,77,94,0.3)] cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('patientPortal.deleteDataBtn', null, 'Delete My Data & Account')}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e13] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[var(--critical)]/40">
            <div className="w-12 h-12 rounded-full bg-[var(--critical)]/15 border border-[var(--critical)]/30 text-[var(--critical)] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(255,77,94,0.3)]">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-display font-bold text-[var(--text)]">Confirm Irreversible Deletion</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {t('patientPortal.deleteConfirm', null, 'Are you sure you want to permanently delete your account and all associated health records? This action is irreversible.')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="min-h-[44px] flex-1 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteData}
                className="min-h-[44px] flex-1 py-2.5 bg-[var(--critical)] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(255,77,94,0.3)] cursor-pointer disabled:opacity-60 transition-all"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
