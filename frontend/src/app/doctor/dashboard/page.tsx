'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ToastProvider';

/* ─── Types ─────────────────────────────────────────── */
interface QueueItem {
  id: string;
  name: string;
  time: string;
  type: string;
  status: 'WAITING' | 'SCHEDULED' | 'COMPLETED' | 'ONGOING';
  initials: string;
  avatarColor: string;
}

interface QueueResponse {
  items: {
    id: string;
    patientName: string;
    scheduledAt: string;
    type: string;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  }[];
}

interface HourSlot {
  label: string;
  state: 'open' | 'restricted';
  booked?: boolean;
}

interface AvailabilityResponse {
  availability: {
    date: string;
    slotsJson: { time: string; available: boolean }[];
    bookedTimes?: string[];
  }[];
}

interface AvailabilitySaveResponse {
  success: boolean;
}

/* ─── Helpers ────────────────────────────────────────── */
/** Returns an array of Date objects: today + 13 following days (2 weeks total) */
function buildDateRange(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDay(d: Date) {
  return SHORT_DAY[d.getDay()];
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtFull(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** Default slot layout – randomly varied per day offset so different days look distinct */
function buildSlots(dayOffset: number): HourSlot[] {
  const base = [
    'open', 'open', 'restricted', 'open',
    'restricted', 'restricted', 'open', 'open',
    'open', 'open', 'restricted', 'open',
  ] as const;
  // shift pattern by dayOffset to give each day a unique look
  return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(
    (label, i) => ({ label, state: base[(i + dayOffset) % base.length] }),
  );
}

/* ─── Mock data ──────────────────────────────────────── */
const CONSULTATIONS_TODAY = 12;
const YESTERDAY_DIFF = 4;

/* ─── Status badge ───────────────────────────────────── */
const STATUS_STYLES: Record<QueueItem['status'], string> = {
  WAITING:   'bg-teal-100 text-teal-700',
  SCHEDULED: 'bg-slate-100 text-slate-600',
  ONGOING:   'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-400',
};

function StatusBadge({ status }: { status: QueueItem['status'] }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function DoctorDashboard() {
  const session = useSession();
  const { showToast } = useToast();
  const dateRange = useMemo(() => buildDateRange(), []);

  // selectedDayIndex: 0 = today, 1 = tomorrow, …, 13 = 2 weeks out
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Per-day slot state keyed by day index
  const [daySlots, setDaySlots] = useState<Record<number, HourSlot[]>>(() =>
    Object.fromEntries(dateRange.map((_, i) => [i, buildSlots(i)])),
  );
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isAvailabilitySaving, setIsAvailabilitySaving] = useState(false);
  const [savedDay, setSavedDay] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  const slots = daySlots[selectedDayIndex] ?? [];
  const selectedDate = dateRange[selectedDayIndex];
  const now = new Date();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();
  const currentHour = now.getHours();
  const displaySlots = slots.map((slot) => {
    if (!isToday) return { ...slot, timing: 'upcoming' as const };
    const hour = Number(slot.label.split(':')[0]);
    if (Number.isNaN(hour)) return { ...slot, timing: 'upcoming' as const };
    if (hour < currentHour) return { ...slot, timing: 'past' as const };
    if (hour === currentHour) return { ...slot, timing: 'ongoing' as const };
    return { ...slot, timing: 'upcoming' as const };
  });

  const toggleSlot = (label: string) => {
    setDaySlots(prev => ({
      ...prev,
      [selectedDayIndex]: prev[selectedDayIndex].map(s =>
        s.label === label ? { ...s, state: s.state === 'open' ? 'restricted' : 'open' } : s,
      ),
    }));
    setSavedDay(null);
  };

  const applyChanges = async () => {
    if (!session?.token) return;
    const selectedSlots = daySlots[selectedDayIndex] ?? [];

    try {
      setIsAvailabilitySaving(true);
      setAvailabilityError(null);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const date = selectedDate.toLocaleDateString('en-CA');
      const response = await fetch(`${apiBaseUrl}/api/doctor/availability`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, slots: selectedSlots }),
      });

      const data = (await response.json()) as AvailabilitySaveResponse;
      if (!response.ok || !data.success) {
        throw new Error((data as { error?: string }).error || 'Failed to save availability');
      }

      setSavedDay(selectedDayIndex);
      setTimeout(() => setSavedDay(null), 2500);
      showToast({
        title: 'Availability updated',
        description: 'Your time slots were saved.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save availability';
      setAvailabilityError(message);
    } finally {
      setIsAvailabilitySaving(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isSaved = savedDay === selectedDayIndex;

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!session?.token) {
        setIsAvailabilityLoading(false);
        setAvailabilityError(null);
        return;
      }

      try {
        setIsAvailabilityLoading(true);
        setAvailabilityError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const from = dateRange[0];
        const to = dateRange[dateRange.length - 1];
        const fromParam = from.toLocaleDateString('en-CA');
        const toParam = to.toLocaleDateString('en-CA');

        const tzOffsetMinutes = new Date().getTimezoneOffset();
        const response = await fetch(
          `${apiBaseUrl}/api/doctor/availability/range?from=${fromParam}&to=${toParam}&tzOffsetMinutes=${tzOffsetMinutes}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          }
        );

        const data = (await response.json()) as AvailabilityResponse;
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load availability');
        }

        const availabilityByDate = new Map(
          data.availability.map((item) => [
            new Date(item.date).toLocaleDateString('en-CA'),
            {
              slots: item.slotsJson,
              booked: new Set(item.bookedTimes ?? []),
            },
          ])
        );

        const nextDaySlots = Object.fromEntries(
          dateRange.map((date, i) => {
            const key = date.toLocaleDateString('en-CA');
            const availability = availabilityByDate.get(key);
            if (!availability) {
              return [i, buildSlots(i)];
            }
            const mapped = availability.slots.map((slot) => ({
              label: slot.time,
              booked: availability.booked.has(slot.time),
              state: availability.booked.has(slot.time)
                ? 'restricted'
                : slot.available
                ? 'open'
                : 'restricted',
            }));
            return [i, mapped];
          })
        );

        setDaySlots(nextDaySlots);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load availability';
        setAvailabilityError(message);
      } finally {
        setIsAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, [dateRange, session?.token]);

  useEffect(() => {
    const fetchQueue = async () => {
      if (!session?.token) {
        setIsQueueLoading(false);
        setQueueError(null);
        return;
      }

      try {
        setIsQueueLoading(true);
        setQueueError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const todayParam = new Date().toLocaleDateString('en-CA');
        const response = await fetch(
          `${apiBaseUrl}/api/doctor/queue?date=${todayParam}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          }
        );

        const data = (await response.json()) as QueueResponse;
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load queue');
        }

        const now = new Date();
        const items = data.items.map((item) => {
          const scheduled = new Date(item.scheduledAt);
          const localScheduled = new Date(
            scheduled.getTime() - now.getTimezoneOffset() * 60000
          );
          const time = scheduled.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          const isOngoing =
            localScheduled.getUTCFullYear() === now.getFullYear() &&
            localScheduled.getUTCMonth() === now.getMonth() &&
            localScheduled.getUTCDate() === now.getDate() &&
            localScheduled.getUTCHours() === now.getHours();
          const initials = item.patientName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('');
          const colorSeed = item.patientName.charCodeAt(0) || 0;
          const avatarColor = `hsl(${(colorSeed * 37) % 360}, 45%, 55%)`;
          return {
            id: item.id,
            name: item.patientName,
            time,
            type: item.type,
            status:
              item.status === 'COMPLETED'
                ? 'COMPLETED'
                : isOngoing
                ? 'ONGOING'
                : 'SCHEDULED',
            initials,
            avatarColor,
          } as QueueItem;
        });

        setQueue(items);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load queue';
        setQueueError(message);
      } finally {
        setIsQueueLoading(false);
      }
    };

    fetchQueue();
  }, [session?.token]);

  const nextSessionId = queue.find(
    (item) => item.status === 'WAITING' || item.status === 'ONGOING' || item.status === 'SCHEDULED'
  )?.id;

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* ── Hero header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">
            Doctor&apos;s Cockpit
          </h1>
            <p className="text-slate-500 text-sm md:text-base">
            {greeting}, Dr. Aris. You have{' '}
              <span className="font-semibold text-slate-700">
              {queue.filter(q => q.status !== 'COMPLETED').length} patients
              </span>{' '}
              today.
            </p>
        </div>

        {/* Consultations today card */}
        <div className="flex-shrink-0 border border-slate-200 rounded-2xl px-5 py-4 bg-white shadow-sm min-w-[140px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Consultations Today
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{CONSULTATIONS_TODAY}</span>
            <span className="text-xs font-semibold text-teal-600">
              +{YESTERDAY_DIFF} vs yesterday
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Availability Manager ─────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">

          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Availability Manager</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle slots to open or restrict booking hours.
              </p>
            </div>
            {/* Legend – wraps below title on very small screens */}
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                Restricted
              </span>
            </div>
          </div>

          {/* ── Date strip ──────────────────────────── */}
          <div>
            {/* Week label */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">
                {fmtFull(selectedDate)}
              </p>
              {selectedDayIndex === 0 && (
                <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">TODAY</span>
              )}
            </div>

            {/* Scrollable day pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {dateRange.map((date, i) => {
                const isToday = i === 0;
                const isSelected = i === selectedDayIndex;
                const hasSaved = savedDay === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDayIndex(i)}
                    className={`flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1 ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : isToday
                        ? 'border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100'
                        : 'border-slate-100 text-slate-500 bg-white hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                      {fmtDay(date)}
                    </span>
                    <span className="text-sm font-black leading-tight">
                      {date.getDate()}
                    </span>
                    <span className="text-[9px] opacity-70">
                      {fmtDate(date).split(' ')[0]}
                    </span>
                    {hasSaved && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-300 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot grid – 3 cols on mobile, 4 cols on sm+ */}
          {availabilityError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {availabilityError}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {isAvailabilityLoading
                ? Array.from({ length: 12 }).map((_, idx) => (
                    <div
                      key={`slot-skeleton-${idx}`}
                      className="rounded-xl py-3 px-1 border-2 border-slate-100 bg-slate-50 animate-pulse h-[52px]"
                    />
                  ))
                : displaySlots.map((slot) => (
                    <button
                      key={slot.label}
                      onClick={() => toggleSlot(slot.label)}
                      disabled={slot.timing !== 'upcoming' || slot.booked}
                      className={`rounded-xl py-3 px-1 flex flex-col items-center transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-400 ${
                        slot.timing === 'past'
                          ? 'bg-slate-50 border-slate-100 text-slate-400'
                          : slot.timing === 'ongoing'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : slot.state === 'open'
                          ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold">{slot.label}</span>
                      <span className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide opacity-80">
                        {slot.timing === 'past'
                          ? 'PAST'
                          : slot.timing === 'ongoing'
                          ? 'ONGOING'
                          : slot.state === 'open'
                          ? 'OPEN'
                          : slot.booked
                          ? 'BOOKED'
                          : 'UNAVAILABLE'}
                      </span>
                    </button>
                  ))}
            </div>
          )}

          {/* Apply button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={applyChanges}
              disabled={isAvailabilitySaving}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isSaved
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md'
              } ${isAvailabilitySaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isAvailabilitySaving ? 'Saving...' : isSaved ? '✓ Saved' : 'Apply Changes'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Today's Queue ───────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Today&apos;s Queue</h2>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>

          {/* Queue list */}
          {isQueueLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={`queue-skeleton-${idx}`} className="flex items-center gap-4 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="h-4 w-12 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : queueError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {queueError}
            </div>
          ) : queue.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 py-3 ${
                    idx === 0 ? 'border-l-4 border-teal-500 pl-3 -ml-3 rounded-l-sm' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${item.status === 'COMPLETED' ? 'text-slate-400' : 'text-slate-800'}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.time} &bull; {item.type}
                    </p>
                  </div>

                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {nextSessionId ? (
            <Link
              href={`/doctor/appointments/${nextSessionId}`}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path strokeLinecap="round" d="M8 12h8M12 8v8" />
              </svg>
              Start Next Session
            </Link>
          ) : (
            <div className="mt-2 w-full text-center text-xs text-slate-400 py-3">
              No upcoming sessions
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║              BACKEND IMPLEMENTATION NOTES                    ║
 ╚══════════════════════════════════════════════════════════════╝

 ── DOCTOR COCKPIT ───────────────────────────────────────────

 1. GET /api/doctor/dashboard/summary
    Returns the hero-header numbers for the authenticated doctor.
    Response: {
      doctorName: string,           // e.g. "Dr. Aris"
      consultationsToday: number,   // total consultations for today
      consultationsYesterday: number,
      activePatients: number,       // status !== COMPLETED
    }

 ── AVAILABILITY MANAGER ─────────────────────────────────────

 2. GET /api/doctor/availability?date=YYYY-MM-DD
    Returns the slot config for a single calendar date.
    Response: {
      date: string,
      slots: { label: string; state: 'open' | 'restricted' }[]
    }
    - Should merge: base recurring template + any date-specific overrides.

 3. GET /api/doctor/availability/range?from=YYYY-MM-DD&to=YYYY-MM-DD
    Batch-fetch slot configs for a date range (used on initial load to
    pre-populate the 14-day strip without 14 round-trips).

 4. PUT /api/doctor/availability
    Save / overwrite slot config for a specific date.
    Request:  { date: string; slots: { label: string; state: 'open' | 'restricted' }[] }
    Response: { success: boolean; savedAt: string }

    Validation:
    - Reject updates for dates in the past.
    - Reject updates where an already-booked appointment slot is being
      switched to 'restricted' without first cancelling the appointment.
    - Minimum notice: cannot restrict a slot within 2 hours of its start.

 ── TODAY'S QUEUE ────────────────────────────────────────────

 5. GET /api/doctor/queue?date=YYYY-MM-DD
    Returns the ordered consultation queue for the given date.
    Response: {
      items: {
        id: string;
        patientName: string;
        patientAvatarUrl?: string;
        scheduledTime: string;    // ISO timestamp
        type: string;             // e.g. "Follow-up", "Tele-consult"
        status: 'WAITING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
      }[]
    }
    - Default sort: scheduledTime ASC, WAITING first.

 6. PATCH /api/doctor/queue/:appointmentId/status
    Update a single queue item's status (e.g., mark as COMPLETED).
    Request:  { status: 'WAITING' | 'COMPLETED' | 'CANCELLED' }
    Response: { success: boolean; updatedAt: string }

 7. POST /api/doctor/queue/start-next
    Marks the next WAITING appointment as IN_PROGRESS and returns its
    details so the doctor can be routed into the consultation room.
    Response: { appointmentId: string; patientId: string; roomUrl: string }

 ── DATA MODEL NOTES ─────────────────────────────────────────

  DoctorAvailability table:
    doctorId     UUID  FK → doctors.id
    date         DATE
    slotsJson    JSONB  -- [{ label, state }]
    createdAt    TIMESTAMPTZ
    updatedAt    TIMESTAMPTZ
    PRIMARY KEY  (doctorId, date)

  Appointments table (existing, relevant columns):
    id, doctorId, patientId, scheduledAt, type, status, roomUrl

 ── REAL-TIME ────────────────────────────────────────────────

  Consider subscribing the Queue panel to a WebSocket or
  Supabase Realtime channel keyed by doctorId so that status
  changes made by patients or admin appear instantly without
  a manual page refresh.

  Channel pattern:  "queue:doctor:{doctorId}"
  Events:           queue.item.updated | queue.item.added | queue.item.removed
*/
