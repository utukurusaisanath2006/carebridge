import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Users,
  Search,
  User,
  AlertTriangle,
  Heart,
  Phone,
  Calendar,
  FilePlus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function OperatorPatientsView({ onSelectPatient }) {
  const { authFetch } = useAuth();
  const { t } = useSettings();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/patients`);
      if (!res.ok) {
        throw new Error('Failed to load registered patients list');
      }
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = p.full_name?.toLowerCase().includes(q);
    const uhidMatch = p.uhid?.toLowerCase().includes(q);
    const phoneMatch = p.mobile?.includes(q);
    return nameMatch || uhidMatch || phoneMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[var(--accent)]" />
              <span>{t('patientPortal.patientsDirectory', null, 'Registered Patients Directory')}</span>
            </h2>
            <span className="text-xs px-3 py-0.5 rounded-full font-mono font-bold bg-[var(--surface-2)] text-[var(--accent-2)] border border-[var(--accent-2)]/30">
              {patients.length} Total
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t('patientPortal.patientsDirSub', null, 'Manage patient registrations, safety flags, and initiate coordinated intake.')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPatients}
          className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--text-faint)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('patientPortal.searchPatients', null, 'Search patients by name, UHID, or mobile...')}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/30 placeholder-[var(--text-faint)]"
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--critical)]/10 border-l-4 border-l-[var(--critical)] border border-[var(--critical)]/30 text-[var(--critical)] text-xs flex items-center gap-2.5 shadow-md">
          <AlertTriangle className="w-4 h-4 text-[var(--critical)]" />
          <span>{error}</span>
        </div>
      )}

      {/* Patients Grid */}
      {loading ? (
        <div className="p-12 text-center text-[var(--text-faint)] text-xs flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
          <span className="font-mono">Loading registered patients...</span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="glass-card rounded-2xl border border-[var(--border)] p-12 text-center text-[var(--text-muted)] text-xs">
          <Users className="w-10 h-10 text-[var(--text-faint)] mx-auto mb-3" />
          <p className="font-semibold">{t('patientPortal.noPatientsFound', null, 'No registered patients found matching your search.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => {
            const allergies = patient.allergies || [];
            const conditions = patient.chronic_conditions || [];
            const medicines = patient.current_medicines || [];

            return (
              <div
                key={patient.id}
                className="glass-card rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center font-display font-extrabold text-sm shadow-[0_0_15px_rgba(255,98,66,0.15)]">
                        {patient.full_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text)] leading-tight">
                          {patient.full_name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          {patient.uhid || 'UHID-UNASSIGNED'} • {patient.age ? `${patient.age} yrs` : 'Age N/A'}, {patient.sex || 'M'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] font-mono text-[var(--text-faint)] border border-[var(--border)]">
                      {patient.preferred_language?.toUpperCase() || 'EN'}
                    </span>
                  </div>

                  {/* Contact & Caregiver */}
                  <div className="py-2.5 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />
                      <span>{patient.mobile || 'N/A'}</span>
                    </div>

                    <div className="text-[11px] truncate">
                      <span className="text-[var(--text-faint)]">Caregiver: </span>
                      <strong className="text-[var(--text)]">{patient.caregiver?.name || 'None'}</strong>
                    </div>
                  </div>

                  {/* Clinical Badges */}
                  <div className="space-y-2 pt-1">
                    {/* Allergies */}
                    {allergies.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--critical)] shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {allergies.map((a, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-[var(--critical)]/15 border border-[var(--critical)]/30 text-[var(--critical)] rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chronic Conditions */}
                    {conditions.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Heart className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {conditions.map((c, i) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Meds */}
                    {medicines.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-2)] shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {medicines.map((m, i) => (
                            <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-[var(--accent-2)]/15 border border-[var(--accent-2)]/30 text-[var(--accent-2)] rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-faint)] flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Active'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectPatient && onSelectPatient(patient)}
                    className="min-h-[38px] px-4 py-1.5 bg-[var(--accent)] hover:bg-[#ff7559] text-[#050505] text-xs font-bold rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(255,98,66,0.25)] cursor-pointer transition-all"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>{t('patientPortal.newIntakeForPatient', null, 'New Intake')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
