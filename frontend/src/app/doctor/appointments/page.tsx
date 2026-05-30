'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ToastProvider';

/* ─── Types ──────────────────────────────────────────── */
type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  initials: string;
  avatarColor: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  roomUrl?: string | null;
}

interface DoctorAppointmentsResponse {
  appointments: {
    id: string;
    patientId: string;
    patientName: string;
    scheduledAt: string;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    notes: string | null;
    roomUrl?: string | null;
  }[];
}

const STATUS_META: Record<AppointmentStatus, { label: string; dot: string; pill: string }> = {
  upcoming:  { label: 'Upcoming',  dot: 'bg-teal-500',  pill: 'bg-teal-50 text-teal-700 border border-teal-100' },
  completed: { label: 'Completed', dot: 'bg-slate-400',  pill: 'bg-slate-100 text-slate-500 border border-slate-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',   pill: 'bg-red-50 text-red-600 border border-red-100' },
};

const TABS: { key: AppointmentStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Page ───────────────────────────────────────────── */
export default function DoctorAppointments() {
  const session = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<AppointmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (sessionStorage.getItem('consultation_completed') === 'true') {
      sessionStorage.removeItem('consultation_completed');
      showToast({
        title: 'Consultation completed',
        description: 'The appointment has been marked as completed.',
        variant: 'success',
      });
    }
  }, [showToast]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.token) {
        setIsLoading(false);
        setLoadError(null);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/doctor/appointments`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const data = (await response.json()) as DoctorAppointmentsResponse;
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load appointments');
        }

        const mapped = data.appointments.map((appointment) => {
          const initials = appointment.patientName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('');
          const colorSeed = appointment.patientName.charCodeAt(0) || 0;
          const avatarColor = `hsl(${(colorSeed * 37) % 360}, 45%, 55%)`;
          const scheduled = new Date(appointment.scheduledAt);
          return {
            id: appointment.id,
            patientName: appointment.patientName,
            patientId: appointment.patientId,
            initials,
            avatarColor,
            date: scheduled.toISOString().slice(0, 10),
            time: scheduled.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
            status:
              appointment.status === 'COMPLETED'
                ? 'completed'
                : appointment.status === 'CANCELLED'
                ? 'cancelled'
                : 'upcoming',
            notes: appointment.notes || undefined,
            roomUrl: appointment.roomUrl || null,
          } as Appointment;
        });

        setAppointments(mapped);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load appointments';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [session?.token]);

  const openCancel = (apt: Appointment) => { setCancelTarget(apt); setCancelReason(''); };
  const closeCancel = () => { setCancelTarget(null); setCancelReason(''); };

  const confirmCancel = async () => {
    if (!cancelTarget || !session?.token) return;
    setCancelling(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiBaseUrl}/api/appointments/${cancelTarget.id}/doctor-cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: cancelReason.trim() || undefined,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      setAppointments(prev =>
        prev.map(a => a.id === cancelTarget.id ? { ...a, status: 'cancelled' as AppointmentStatus, notes: cancelReason || undefined } : a)
      );
      showToast({
        title: 'Appointment cancelled',
        description: 'The appointment has been cancelled.',
        variant: 'success',
      });
      closeCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel appointment';
      showToast({
        title: 'Cancellation failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setCancelling(false);
    }
  };

  const filtered = appointments.filter(a => {
    const matchTab = tab === 'all' || a.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || a.patientName.toLowerCase().includes(q) || a.patientId.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = {
    all:       appointments.length,
    upcoming:  appointments.filter(a => a.status === 'upcoming').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Appointments</h1>
          <p className="text-slate-500 text-sm">View and manage your scheduled consultations.</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search patient…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">Loading appointments…</p>
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
          {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">No appointments found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(apt => {
            const meta = STATUS_META[apt.status];
            return (
              <div key={apt.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow duration-200">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: apt.avatarColor }}>
                  {apt.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900">{apt.patientName}</p>
                    <span className="text-[10px] text-slate-400">#{apt.patientId}</span>
                  </div>
                  <p className="text-xs text-slate-500">{fmtDate(apt.date)} at {apt.time}</p>
                  {apt.notes && <p className="text-xs text-slate-400 mt-1 italic truncate">"{apt.notes}"</p>}
                </div>

                {/* Status + Action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>

                  {apt.status === 'upcoming' && (
                    <>
                      <Link
                        href={`/doctor/appointments/${apt.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-all duration-150 shadow-sm hover:shadow"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        Join
                      </Link>
                      <button
                        onClick={() => openCancel(apt)}
                        title="Cancel appointment"
                        className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-3 py-2 rounded-xl transition-all duration-150"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <Link href={`/doctor/appointments/${apt.id}`} className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all duration-150">
                      View
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancel confirmation modal ─────────────── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  You are about to cancel the appointment with{' '}
                  <span className="font-semibold text-slate-700">{cancelTarget.patientName}</span>{' '}
                  on {fmtDate(cancelTarget.date)} at {cancelTarget.time}.
                </p>
              </div>
            </div>

            {/* Reason field */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Reason <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, patient rescheduled…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeCancel}
                disabled={cancelling}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 rounded-xl text-sm transition-all duration-150 disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-150 shadow-sm"
              >
                {cancelling ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Cancelling…</>
                ) : (
                  'Yes, Cancel It'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║       BACKEND IMPLEMENTATION NOTES — DOCTOR APPOINTMENTS     ║
 ╚══════════════════════════════════════════════════════════════╝

 1. GET /api/doctor/appointments?status=upcoming|completed|cancelled&date=YYYY-MM-DD
    Returns paginated appointment list for the authenticated doctor.
    Response: {
      items: Appointment[];
      total: number;
      page: number;
      pageSize: number;
    }

 2. GET /api/doctor/appointments/:id
    Returns full appointment details including patient summary,
    clinical notes, and prescriptions for the consultation room.

 3. PATCH /api/doctor/appointments/:id/status
    Update appointment status (e.g., complete or cancel).
    Request:  { status: 'completed' | 'cancelled'; notes?: string }
    Response: { success: boolean; updatedAt: string }

 Data model: see /doctor/appointments/[id] notes.
*/
