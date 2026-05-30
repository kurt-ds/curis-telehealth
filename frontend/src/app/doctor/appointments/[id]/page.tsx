'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────── */
interface Prescription {
  id: string;
  medication: string;
  frequency: string;
  duration: string;
}

interface Patient {
  name: string;
  patientId: string;
  age: number;
  gender: string;
  weight: string;
  weightStatus: string;
  allergies: string[];
  vitals: number[]; // recent vital scores for bar chart
}

/* ─── Mock data keyed by appointment id ─────────────── */
const PATIENTS: Record<string, Patient> = {
  'apt-001': { name: 'Robert Miller',   patientId: 'RM-4492-00', age: 42, gender: 'Male',   weight: '82.5 kg', weightStatus: 'Stable',   allergies: ['Penicillin', 'Shellfish', 'Peanuts'], vitals: [60, 55, 65, 50, 75, 80] },
  'apt-002': { name: 'Elena Rodriguez', patientId: 'ER-3310-01', age: 35, gender: 'Female',  weight: '61.0 kg', weightStatus: 'Stable',   allergies: ['Aspirin'],                            vitals: [70, 72, 68, 74, 71, 73] },
  'apt-003': { name: 'Samuel Chen',     patientId: 'SC-7721-02', age: 58, gender: 'Male',   weight: '90.2 kg', weightStatus: 'Monitor',  allergies: ['Sulfa drugs'],                        vitals: [55, 60, 58, 62, 59, 63] },
};

const FALLBACK_PATIENT: Patient = {
  name: 'Unknown Patient', patientId: '??-0000-00', age: 0, gender: '—',
  weight: '—', weightStatus: '—', allergies: [], vitals: [60, 65, 62, 68, 64, 70],
};

/* ─── Vital bar chart ────────────────────────────────── */
function VitalBars({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const colors = ['bg-teal-200', 'bg-teal-300', 'bg-teal-300', 'bg-teal-400', 'bg-teal-500', 'bg-teal-700'];
  return (
    <div className="flex items-end gap-1.5 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${colors[i % colors.length]} transition-all duration-300`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function ConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const patient = PATIENTS[id] ?? FALLBACK_PATIENT;

  /* Notes – autosave simulation */
  const [notes, setNotes]         = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved]  = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutosave = useCallback((val: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setAutoSaving(true);
    saveTimer.current = setTimeout(() => {
      // TODO: PATCH /api/doctor/appointments/:id/notes  { notes: val }
      setAutoSaving(false);
      setLastSaved(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
  }, []);

  const handleNotes = (v: string) => { setNotes(v); triggerAutosave(v); };

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  /* Prescriptions */
  const [rxList, setRxList] = useState<Prescription[]>([
    { id: '1', medication: 'Amoxicillin 500mg', frequency: 'TID (3x daily)', duration: '7 Days' },
  ]);

  const addRx = () => setRxList(prev => [...prev, { id: Date.now().toString(), medication: '', frequency: '', duration: '' }]);
  const removeRx = (rxId: string) => setRxList(prev => prev.filter(r => r.id !== rxId));
  const updateRx = (rxId: string, field: keyof Prescription, val: string) =>
    setRxList(prev => prev.map(r => r.id === rxId ? { ...r, [field]: val } : r));

  /* Complete consultation */
  const JITSI_URL = 'https://meet.jit.si/curis-telehealth';
  const [completing, setCompleting] = useState(false);
  const completeConsultation = async () => {
    setCompleting(true);
    await new Promise(r => setTimeout(r, 1000));
    // TODO: PATCH /api/doctor/appointments/:id/status { status:'completed', notes, prescriptions: rxList }
    router.push('/doctor/appointments');
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-400';

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/doctor/appointments" className="hover:text-teal-600 transition-colors">Appointments</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-600 font-semibold">Consultation — {patient.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT PANEL ───────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Video / Ready card */}
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-slate-800 to-slate-900 min-h-[220px] flex flex-col items-center justify-center text-center p-8">
            {/* Decorative blobs */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-teal-500 blur-3xl" />
              <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-teal-700 blur-3xl" />
            </div>
            {/* Fake camera placeholder */}
            <div className="relative mb-4 w-16 h-16 rounded-full bg-teal-600/80 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <h2 className="relative text-xl font-black text-white mb-1">Ready to Connect</h2>
            <p className="relative text-sm text-slate-300 mb-6">Patient {patient.name} is waiting in the lobby.</p>
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
          </div>

          {/* Patient summary card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            {/* Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                <p className="text-xs text-slate-400">Patient ID: #{patient.patientId}</p>
              </div>
            </div>

            {/* Biometric chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Age &amp; Gender</p>
                <p className="text-sm font-bold text-slate-800">{patient.age} Yrs, {patient.gender}</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Weight</p>
                <p className="text-sm font-bold text-slate-800">{patient.weight} ({patient.weightStatus})</p>
              </div>
            </div>

            {/* Allergies */}
            {patient.allergies.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Critical Allergies</span>
                </div>
                <p className="text-sm font-bold text-red-600">{patient.allergies.join(', ')}</p>
              </div>
            )}

            {/* Vital history bars */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Recent Vital History</p>
              <VitalBars values={patient.vitals} />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Clinical notes */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-sm font-bold text-slate-900">Live Clinical History Notes</h2>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                {autoSaving ? 'Autosaving…' : lastSaved ? `Saved ${lastSaved}` : 'Autosaving…'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotes(e.target.value)}
              placeholder="Start typing observation notes here..."
              rows={7}
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
                  {/* Remove button */}
                  <button
                    onClick={() => removeRx(rx.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow"
                  >×</button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Medication Name</label>
                      <input
                        value={rx.medication}
                        onChange={e => updateRx(rx.id, 'medication', e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg"
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
                      <input
                        value={rx.frequency}
                        onChange={e => updateRx(rx.id, 'frequency', e.target.value)}
                        placeholder="e.g. TID (3x daily)"
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                      <input
                        value={rx.duration}
                        onChange={e => updateRx(rx.id, 'duration', e.target.value)}
                        placeholder="e.g. 7 Days"
                        className={`${inputCls} w-full`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addRx}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-teal-400 text-slate-500 hover:text-teal-600 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Medication
            </button>
          </div>

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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Consultation &amp; Sign
                </>
              )}
            </button>
            <button className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl text-sm transition-all duration-200">
              Referral Needed
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║    BACKEND IMPLEMENTATION NOTES — CONSULTATION ROOM          ║
 ╚══════════════════════════════════════════════════════════════╝

 ── LOAD CONSULTATION DATA ───────────────────────────────────

 1. GET /api/doctor/appointments/:id
    Returns full data for the consultation room.
    Response: {
      appointment: {
        id, scheduledAt, type, status, roomUrl;   // roomUrl = Zoom / Daily.co link
      };
      patient: {
        id, name, patientId, age, gender,
        weight, weightStatus,
        allergies: string[],
        vitals: { date: string; value: number }[],  // last 6 entries
      };
      notes: string;                // previously saved clinical notes
      prescriptions: Prescription[];
    }

 ── AUTOSAVE NOTES ───────────────────────────────────────────

 2. PATCH /api/doctor/appointments/:id/notes
    Debounced – fire 1–2 s after the doctor stops typing.
    Request:  { notes: string }
    Response: { savedAt: string }

 ── SAVE PRESCRIPTIONS ───────────────────────────────────────

 3. PUT /api/doctor/appointments/:id/prescriptions
    Request:  { prescriptions: { medication, frequency, duration }[] }
    Response: { success: boolean }

 ── COMPLETE CONSULTATION ────────────────────────────────────

 4. PATCH /api/doctor/appointments/:id/status
    Request:  { status: 'completed'; notes: string; prescriptions: Prescription[] }
    Response: { success: boolean; completedAt: string }

    Side effects:
    - Sends prescription PDF to patient via email.
    - Marks appointment COMPLETED in DB.
    - Triggers billing record creation.
    - Releases the Zoom / video room.

 ── REFERRAL ─────────────────────────────────────────────────

 5. POST /api/doctor/appointments/:id/referral
    Request:  { specialistType: string; urgency: 'routine'|'urgent'; notes: string }
    Response: { referralId: string; referralCode: string }

 ── VIDEO ROOM ───────────────────────────────────────────────

  Option A – Zoom Meeting SDK
    - Generate a JWT signature server-side: POST /api/video/zoom/signature
    - Embed ZoomMtgEmbedded in an iframe or launch native app via zoom://

  Option B – Daily.co
    - Create room on appointment booking: POST https://api.daily.co/v1/rooms
    - Return a short-lived meeting token for doctor and patient.
    - Use @daily-co/daily-js for embedded video.

 ── DATA MODEL ───────────────────────────────────────────────

  appointments table:
    id               UUID PK
    doctorId         UUID FK
    patientId        UUID FK
    scheduledAt      TIMESTAMPTZ
    type             TEXT
    status           TEXT  -- upcoming | completed | cancelled
    roomUrl          TEXT NULL
    clinicalNotes    TEXT NULL
    completedAt      TIMESTAMPTZ NULL

  prescriptions table:
    id             UUID PK
    appointmentId  UUID FK → appointments.id
    medication     TEXT
    frequency      TEXT
    duration       TEXT
    createdAt      TIMESTAMPTZ
*/
