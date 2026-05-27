'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SessionDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc';
}

interface SessionChecklistItem {
  id: string;
  label: string;
  status: 'complete' | 'pending';
}

export default function PatientAppointmentSession() {
  const params = useParams();
  const appointmentId = params.id as string;

  const sessionStart = useMemo(() => new Date(Date.now() + 15 * 60 * 1000), []);
  const sessionEnd = useMemo(() => new Date(sessionStart.getTime() + 30 * 60 * 1000), [sessionStart]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doctor = {
    name: 'Dr. Sarah Chen',
    specialty: 'General Medicine',
    credentials: 'Board Certified',
    location: 'Curis Clinic A',
  };

  const sessionDocuments: SessionDocument[] = [
    { id: '1', name: 'Blood_Work_Oct_2023.pdf', type: 'pdf' },
    { id: '2', name: 'Rash_Photo_Front.jpg', type: 'image' },
  ];

  const checklist: SessionChecklistItem[] = [
    { id: '1', label: 'Microphone connected', status: 'complete' },
    { id: '2', label: 'Camera detected', status: 'complete' },
    { id: '3', label: 'Stable internet connection', status: 'complete' },
  ];

  const zoomJoinUrl = 'https://zoom.us/j/1234567890';

  const isInSession = now >= sessionStart && now <= sessionEnd;
  const isSessionUpcoming = now < sessionStart;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');
    return `${displayMinutes}:${displaySeconds}`;
  };

  const startsIn = formatDuration(sessionStart.getTime() - now.getTime());
  const endsIn = formatDuration(sessionEnd.getTime() - now.getTime());

  const sessionStatusLabel = isInSession ? 'In Session' : isSessionUpcoming ? 'Starts In' : 'Session Ended';
  const sessionStatusTime = isInSession ? endsIn : isSessionUpcoming ? startsIn : '00:00';

  const statusStyles = isInSession
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isSessionUpcoming
    ? 'bg-slate-100 text-slate-700 border-slate-200'
    : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/patient/appointments" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Appointments
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-3">
          Consultation with {doctor.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">Specialty: {doctor.specialty}</span>
          <span className="flex items-center gap-1 text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {doctor.credentials}
          </span>
          <span className="text-slate-500">Appointment ID: {appointmentId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Session Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-cyan-500 blur-3xl" />
                <div className="absolute bottom-8 right-8 w-40 h-40 rounded-full bg-cyan-700 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-center gap-3 text-white">
                <div className="w-14 h-14 rounded-full bg-cyan-600/80 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-300">Camera feed will appear here</p>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/70 text-white px-4 py-2 rounded-full">
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  SC
                </div>
                <div>
                  <p className="text-sm font-semibold">{doctor.name}</p>
                  <p className="text-xs text-slate-200">Connecting from {doctor.location}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">Session Preparation</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Please have your latest blood pressure readings and current list of medications ready for review.
                Dr. Chen will begin by going through your recent lab results.
              </p>
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                Reminder: Please ensure you are in a private, well-lit space for the consultation.
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">Shared Documents</h3>
              </div>
              <div className="space-y-3">
                {sessionDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">{doc.type.toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-slate-700">{doc.name}</span>
                    </div>
                    <button className="text-slate-500 hover:text-slate-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session Status Panel */}
        <div className="space-y-6">
          <div className={`border rounded-2xl p-6 text-center ${statusStyles}`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold uppercase tracking-wide">{sessionStatusLabel}</p>
            </div>
            <p className="text-3xl font-black text-slate-900">{sessionStatusTime}</p>
            <p className="text-xs text-slate-500 mt-2">
              {isInSession
                ? `Ends at ${formatTime(sessionEnd)}`
                : isSessionUpcoming
                ? `Starts at ${formatTime(sessionStart)}`
                : `Ended at ${formatTime(sessionEnd)}`}
            </p>
          </div>

          <a
            href={zoomJoinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
            Join Zoom Consultation
          </a>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Pre-call Checklist</h3>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${item.status === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Appointment Details</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Date</span>
                <span className="text-slate-900">May 27, 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Time</span>
                <span className="text-slate-900">{formatTime(sessionStart)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-slate-900">30 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Implementation Notes */}
      {/*
      TODO: Live Session Backend Implementation
      1. GET /api/appointments/{appointmentId}/session
         - Return session start/end time, doctor details, join URL, and status
         - Response: { appointmentId, startTime, endTime, doctor, joinUrl, documents, checklist }

      2. Session Status Logic
         - Server computes status (upcoming, in_session, completed)
         - Provide server time offset to avoid client clock drift
         - Include a "joinWindow" (e.g., allow join 10 minutes before)

      3. Join Link Handling
         - Generate signed/expiring Zoom links per appointment
         - Log access attempts for audit trail
         - Restrict join to authorized patient and doctor

      4. Documents & Checklist
         - GET /api/appointments/{appointmentId}/documents
         - GET /api/appointments/{appointmentId}/checklist
         - Allow uploads for patient-provided documents

      5. Real-time Updates
         - Use WebSocket/SSE to update session state and countdowns
         - Notify if doctor joins late or session delayed

      6. Security
         - Enforce auth and role-based access
         - Mask PHI in logs
         - Store links securely
      */}
    </div>
  );
}
