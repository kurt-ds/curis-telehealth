'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

interface Prescription {
  id: string;
  medication: string;
  frequency: string;
  duration: string;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  bloodType: string | null;
  height: number | null;
  weight: number | null;
  allergies: string[];
  medicalHistory: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
}



export default function ConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const session = useSession();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [pastConsultations, setPastConsultations] = useState<{ id: string; date: string; diagnosis: string | null; notes: string; prescriptions: string[] }[]>([]);
  const [appointmentReason, setAppointmentReason] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.token) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/doctor/appointments/${id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setPatient(data.patient);
          setScheduledAt(data.appointment.scheduledAt);
          setDiagnosis(data.appointment.diagnosis || '');
          setNotes(data.appointment.consultationNotes || '');
          setPastConsultations(data.pastConsultations || []);
          setAppointmentReason(data.appointment.reason || null);
          if (data.appointment.prescriptions?.length > 0) {
            setRxList(
              data.appointment.prescriptions.map((rx: { medication: string; frequency: string; duration: string }, i: number) => ({
                id: String(i + 1),
                medication: rx.medication,
                frequency: rx.frequency,
                duration: rx.duration,
              })),
            );
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session?.token, id]);

  const scheduledTime = scheduledAt ? new Date(scheduledAt) : null;
  const canJoin = !!scheduledTime && now >= scheduledTime.getTime() - 30 * 60 * 1000 && now <= scheduledTime.getTime() + 60 * 60 * 1000;

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutosave = useCallback((val: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setAutoSaving(true);
    saveTimer.current = setTimeout(() => {
      setAutoSaving(false);
      setLastSaved(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
  }, []);

  const handleNotes = (v: string) => { setNotes(v); triggerAutosave(v); };
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const [rxList, setRxList] = useState<Prescription[]>([]);
  const [rxErrors, setRxErrors] = useState<Record<string, string>>({});
  const addRx = () => setRxList(prev => [...prev, { id: Date.now().toString(), medication: '', frequency: '', duration: '' }]);
  const removeRx = (rxId: string) => {
    setRxList(prev => prev.filter(r => r.id !== rxId));
    setRxErrors(prev => { const n = { ...prev }; delete n[rxId]; return n; });
  };
  const updateRx = (rxId: string, field: keyof Prescription, val: string) =>
    setRxList(prev => prev.map(r => r.id === rxId ? { ...r, [field]: val } : r));

  const summarizePatient = async () => {
    if (!patient) return;
    setSummarizing(true);
    setSummaryResult(null);
    setSummaryError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            medicalHistory: patient.medicalHistory,
          },
          reason: appointmentReason || 'Not specified',
          pastConsultations,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Summarization failed');

      setSummaryResult(data.summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to summarize';
      setSummaryError(message);
    } finally {
      setSummarizing(false);
    }
  };

  const JITSI_URL = 'https://meet.jit.si/curis-telehealth';
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const completeConsultation = async () => {
    setCompletionError(null);

    if (!canJoin) {
      setCompletionError('Session is not active. Cannot complete consultation.');
      return;
    }

    if (!diagnosis.trim()) {
      setCompletionError('Diagnosis is required.');
      return;
    }

    if (!notes.trim()) {
      setCompletionError('Consultation notes are required.');
      return;
    }

    const errors: Record<string, string> = {};
    for (const rx of rxList) {
      if (!rx.medication.trim()) errors[rx.id] = 'Medication is required';
      if (!rx.frequency.trim()) errors[rx.id] = 'Frequency is required';
      if (!rx.duration.trim()) errors[rx.id] = 'Duration is required';
    }
    setRxErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCompleting(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/doctor/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosis: diagnosis.trim(),
          consultationNotes: notes.trim(),
          prescriptions: rxList.map((rx) => ({
            medication: rx.medication.trim(),
            frequency: rx.frequency.trim(),
            duration: rx.duration.trim(),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete consultation');
      }

      sessionStorage.setItem('consultation_completed', 'true');
      router.push('/doctor/appointments');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete consultation';
      setCompletionError(message);
      setCompleting(false);
    }
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-400';

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl">
        <p className="text-sm text-slate-400">Loading consultation...</p>
      </div>
    );
  }

  const displayName = patient?.name || 'Patient';

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/doctor/appointments" className="hover:text-teal-600 transition-colors">Appointments</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-600 font-semibold">Consultation — {displayName}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT PANEL ───────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Video / Ready card */}
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-slate-800 to-slate-900 min-h-[220px] flex flex-col items-center justify-center text-center p-8">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-teal-500 blur-3xl" />
              <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-teal-700 blur-3xl" />
            </div>
            <div className="relative mb-4 w-16 h-16 rounded-full bg-teal-600/80 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <h2 className="relative text-xl font-black text-white mb-1">{canJoin ? 'Ready to Connect' : 'Session Not Active'}</h2>
            <p className="relative text-sm text-slate-300 mb-6">{canJoin ? `${displayName} is waiting in the lobby.` : 'Session is not active.'}</p>
            {canJoin && (
              <a
                href={JITSI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition-all duration-200 hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Launch Video Consultation
              </a>
            )}
          </div>

          {/* AI Summarize */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                <h2 className="text-sm font-bold text-slate-900">AI Patient Summary</h2>
              </div>
              <button
                onClick={summarizePatient}
                disabled={summarizing || !patient}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                {summarizing ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Summarizing…</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>Summarize</>
                )}
              </button>
            </div>

            {summaryError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 mb-3">
                {summaryError}
              </div>
            )}

            {summaryResult && (
              <div className="text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                {summaryResult.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-slate-900 mt-3 mb-1 first:mt-0">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.startsWith('* ')) {
                    return <li key={i} className="ml-4 text-slate-700">{line.slice(2)}</li>;
                  }
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="text-slate-700">{line}</p>;
                })}
              </div>
            )}
          </div>

          {/* Patient summary card */}
          {patient && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                  <p className="text-xs text-slate-400">Patient ID: #{patient.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Age &amp; Gender</p>
                  <p className="text-sm font-bold text-slate-800">{patient.age ?? '—'} Yrs, {patient.gender ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Weight / Height</p>
                  <p className="text-sm font-bold text-slate-800">{patient.weight ? `${patient.weight} kg` : '—'} / {patient.height ? `${patient.height} cm` : '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Blood Type</p>
                  <p className="text-sm font-bold text-slate-800">{patient.bloodType || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-sm font-bold text-slate-800">{patient.phone || '—'}</p>
                </div>
              </div>

              {patient.allergies.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Allergies</span>
                  </div>
                  <p className="text-sm font-bold text-red-600">{patient.allergies.join(', ')}</p>
                </div>
              )}

              {patient.medicalHistory && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Medical History</p>
                  <p className="text-sm text-slate-700">{patient.medicalHistory}</p>
                </div>
              )}
            </div>
          )}

          {/* Past Consultations */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Past Consultations</h2>
            </div>
            {pastConsultations.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No past consultations with this patient.</p>
            ) : (
              <div className="space-y-3">
                {pastConsultations.map((pc) => (
                  <div key={pc.id} className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50">
                    <p className="text-xs text-slate-400 mb-1">
                      {new Date(pc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {pc.diagnosis && (
                      <p className="text-sm font-semibold text-slate-800">{pc.diagnosis}</p>
                    )}
                    {pc.notes && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{pc.notes}</p>
                    )}
                    {pc.prescriptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pc.prescriptions.map((rx: string) => (
                          <span key={rx} className="text-[10px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                            💊 {rx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT PANEL ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Diagnosis */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Diagnosis</h2>
            </div>
            <input
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute sinusitis, Hypertension Stage 1…"
              className={`${inputCls} w-full`}
            />
          </div>

          {/* Clinical notes */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-sm font-bold text-slate-900">Clinical Notes</h2>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                {autoSaving ? 'Autosaving…' : lastSaved ? `Saved ${lastSaved}` : 'Autosaving…'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotes(e.target.value)}
              placeholder="Start typing observation notes here..."
              rows={5}
              className={`${inputCls} w-full resize-none`}
            />
          </div>

          {/* Digital E-Prescription Builder */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Digital E-Prescription Builder</h2>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {rxList.map(rx => (
                <div key={rx.id} className="relative border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <button
                    onClick={() => removeRx(rx.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow"
                  >×</button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Medication</label>
                      <input value={rx.medication} onChange={e => updateRx(rx.id, 'medication', e.target.value)} placeholder="e.g. Amoxicillin 500mg" className={`${inputCls} w-full ${rxErrors[rx.id] ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
                      <input value={rx.frequency} onChange={e => updateRx(rx.id, 'frequency', e.target.value)} placeholder="e.g. TID" className={`${inputCls} w-full ${rxErrors[rx.id] ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                      <input value={rx.duration} onChange={e => updateRx(rx.id, 'duration', e.target.value)} placeholder="e.g. 7 Days" className={`${inputCls} w-full ${rxErrors[rx.id] ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                    </div>
                  </div>
                  {rxErrors[rx.id] && (
                    <p className="text-[10px] text-red-500 mt-1.5">{rxErrors[rx.id]}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addRx}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-teal-400 text-slate-500 hover:text-teal-600 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Medication
            </button>
          </div>

          {/* Completion error */}
          {completionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {completionError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={completeConsultation}
              disabled={completing}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow hover:shadow-md"
            >
              {completing ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Completing…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                   Complete &amp; Sign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
