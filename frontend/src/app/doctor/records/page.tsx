'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';

/* ─── Types ──────────────────────────────────────────── */
interface ConsultationRecord {
  id: string;
  date: string;
  type: string;
  diagnosis: string;
  notes: string;
  prescriptions: string[];
  doctor: string;
}

interface PatientRecord {
  id: string;
  name: string;
  patientId: string;
  age: number | null;
  gender: string;
  bloodType: string;
  weight: string | null;
  height: string | null;
  allergies: string[];
  conditions: string[];
  lastVisit: string | null;
  totalVisits: number;
  consultations: ConsultationRecord[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  const colors = ['#4a9d8f', '#5b8dd9', '#c0784b', '#9b9b9b', '#7c5cbf', '#d95b5b', '#5bc0d9', '#8fd95b'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Helpers ────────────────────────────────────────── */
function fmtDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type RecordTab = 'history' | 'consultations';

/* ─── Patient detail panel ───────────────────────────── */
function PatientDetail({ patient, onClose }: { patient: PatientRecord; onClose: () => void }) {
  const [tab, setTab] = useState<RecordTab>('history');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: getColor(patient.name) }}
          >
            {getInitials(patient.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{patient.name}</p>
            <p className="text-xs text-slate-400">
              #{patient.patientId.slice(0, 8)} · {patient.age ?? '?'} yrs · {patient.gender || 'N/A'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(['history', 'consultations'] as RecordTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${
              tab === t ? 'text-teal-600 border-b-2 border-teal-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'history' ? 'Medical History' : 'Consultation Records'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === 'history' && (
          <>
            {/* Biometrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Blood Type', patient.bloodType || 'N/A'],
                ['Weight', patient.weight ?? 'N/A'],
                ['Height', patient.height ?? 'N/A'],
                ['Total Visits', String(patient.totalVisits)],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Conditions */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active Conditions
              </p>
              {patient.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.conditions.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active conditions recorded.</p>
              )}
            </div>

            {/* Allergies */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Known Allergies
              </p>
              {patient.allergies.length > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      className="w-3.5 h-3.5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                      Critical Allergies
                    </span>
                  </div>
                  <p className="text-sm font-bold text-red-600">{patient.allergies.join(', ')}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No known allergies.</p>
              )}
            </div>

            {/* Last visit */}
            {patient.lastVisit && (
              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-teal-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">
                    Last Visit
                  </p>
                  <p className="text-sm font-bold text-teal-800">{fmtDate(patient.lastVisit)}</p>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'consultations' && (
          <div className="space-y-3">
            {patient.consultations.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No consultation records found.
              </p>
            )}
            {patient.consultations.map((c) => {
              const isOpen = expandedId === c.id;
              return (
                <div key={c.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-800">{c.diagnosis}</p>
                        <span className="text-[10px] font-semibold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">
                          {c.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fmtDate(c.date)} · {c.doctor}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Clinical Notes
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.notes}</p>
                      </div>
                      {c.prescriptions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Prescriptions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {c.prescriptions.map((rx) => (
                              <span
                                key={rx}
                                className="text-xs font-medium bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg"
                              >
                                💊 {rx}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.prescriptions.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No prescriptions issued.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function DoctorRecords() {
  const session = useSession();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const fetchPatients = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${apiBaseUrl}/api/doctor/patients?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch patients');
      }
      const data = await res.json();
      setPatients(
        data.items.map((item: Omit<PatientRecord, 'consultations'>) => ({
          ...item,
          consultations: [],
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [session?.token, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const fetchConsultations = useCallback(
    async (patientId: string): Promise<ConsultationRecord[]> => {
      if (!session?.token) return [];
      try {
        const res = await fetch(`${apiBaseUrl}/api/doctor/patients/${patientId}/consultations`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.items;
      } catch {
        return [];
      }
    },
    [session?.token],
  );

  const selectedPatient = patients.find((p) => p.id === selectedId) ?? null;

  /* when selectedId changes, hydrate consultations */
  const [fetchedIds, setFetchedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedId || fetchedIds.has(selectedId)) return;

    fetchConsultations(selectedId).then((consultations) => {
      setFetchedIds((prev) => new Set(prev).add(selectedId));
      setPatients((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...p, consultations } : p)),
      );
    });
  }, [selectedId, fetchConsultations, fetchedIds]);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId.toLowerCase().includes(search.toLowerCase()) ||
      p.conditions.some((c) => c.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Patient Records</h1>
        <p className="text-slate-500 text-sm">
          Browse patient profiles, medical history, and consultation records.
        </p>
      </div>

      <div
        className={`grid gap-6 transition-all duration-300 ${selectedPatient ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}
      >
        {/* ── Patient list ──────────────────────────── */}
        <div className={selectedPatient ? 'lg:col-span-2' : 'col-span-1'}>
          {/* Search */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID, or condition…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          <p className="text-xs text-slate-400 mb-3">
            {loading ? 'Loading…' : `${filtered.length} patient${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                className={`w-full text-left bg-white border rounded-2xl shadow-sm px-5 py-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md ${
                  selectedId === p.id
                    ? 'border-teal-400 ring-1 ring-teal-300'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: getColor(p.name) }}
                >
                  {getInitials(p.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <span className="text-[10px] text-slate-400">#{p.patientId.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.age ?? '?'} yrs · {p.gender || 'N/A'} · {p.bloodType || 'N/A'}
                  </p>
                  {p.conditions.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {p.conditions.slice(0, 2).join(', ')}
                      {p.conditions.length > 2 ? ` +${p.conditions.length - 2} more` : ''}
                    </p>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-1">
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {p.totalVisits} visits
                  </span>
                  <span className="text-[10px] text-slate-400">{fmtDate(p.lastVisit)}</span>
                </div>
              </button>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
                <p className="text-slate-400 text-sm">
                  {search ? 'No patients match your search.' : 'No patients with completed visits yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ─────────────────────────── */}
        {selectedPatient && (
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[80vh] lg:max-h-[calc(100vh-10rem)] sticky top-4">
            <PatientDetail patient={selectedPatient} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
