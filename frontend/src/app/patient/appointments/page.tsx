'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ToastProvider';
import CalendarView from '@/components/CalendarView';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  roomUrl?: string | null;
}

interface AppointmentResponse {
  id: string;
  doctorId: string;
  patientId: string;
  scheduledAt: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  reason: string | null;
  roomUrl?: string | null;
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
}

interface AvailabilityEntry {
  date: string;
  slotsJson: TimeSlot[];
  bookedTimes?: string[];
}

interface AvailabilityDay {
  label: string;
  dateISO: string;
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface RescheduleData {
  selectedDate: string;
  selectedTime: string;
}

export default function PatientAppointments() {
  const session = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCalDate, setSelectedCalDate] = useState('');

  const [cancelingAppointment, setCancelingAppointment] = useState<string | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState<RescheduleData>({
    selectedDate: '',
    selectedTime: '',
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isRescheduleLoading, setIsRescheduleLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.token) {
        setIsLoading(false);
        setAppointments([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/appointments/me`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load appointments');
        }

        const mapped: Appointment[] = (data.appointments as AppointmentResponse[]).map(
          (appointment) => {
            const scheduledDate = new Date(appointment.scheduledAt);
            const status: Appointment['status'] =
              appointment.status === 'UPCOMING'
                ? 'scheduled'
                : appointment.status === 'COMPLETED'
                ? 'completed'
                : 'cancelled';

            return {
              id: appointment.id,
              doctorId: appointment.doctorId,
              doctorName: appointment.doctor.name,
              specialty: appointment.doctor.specialization,
              date: scheduledDate.toLocaleDateString('en-CA'),
              time: scheduledDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }),
              status,
              reason: appointment.reason ?? undefined,
              roomUrl: appointment.roomUrl || null,
            };
          }
        );

        setAppointments(mapped);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load appointments';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [session?.token]);

  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const handleCancelClick = (appointmentId: string) => {
    setCancelingAppointment(appointmentId);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelingAppointment || !session?.token) return;

    setIsCancelLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiBaseUrl}/api/appointments/${cancelingAppointment}/cancel`,
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

      setAppointments((prev) =>
        prev.map((app) =>
          app.id === cancelingAppointment ? { ...app, status: 'cancelled' } : app
        )
      );
      showToast({
        title: 'Appointment cancelled',
        description: 'The appointment has been cancelled.',
        variant: 'success',
      });
      setCancelingAppointment(null);
      setShowCancelConfirm(false);
      setCancelReason('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel appointment';
      setError(message);
      showToast({
        title: 'Cancellation failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleRescheduleClick = (appointmentId: string) => {
    setReschedulingAppointment(appointmentId);
    setRescheduleData({ selectedDate: '', selectedTime: '' });
    setAvailabilityDays([]);
    setAvailabilityError(null);
  };

  const handleRescheduleConfirm = async () => {
    if (!reschedulingAppointment || !rescheduleData.selectedDate || !rescheduleData.selectedTime || !session?.token) return;

    setIsRescheduleLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiBaseUrl}/api/appointments/${reschedulingAppointment}/reschedule`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newDate: rescheduleData.selectedDate,
            newTime: rescheduleData.selectedTime,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      setAppointments((prev) =>
        prev.map((app) =>
          app.id === reschedulingAppointment
            ? { ...app, date: rescheduleData.selectedDate, time: rescheduleData.selectedTime }
            : app
        )
      );
      showToast({
        title: 'Appointment rescheduled',
        description: 'Your appointment has been updated.',
        variant: 'success',
      });
      setReschedulingAppointment(null);
      setRescheduleData({ selectedDate: '', selectedTime: '' });
      setAvailabilityDays([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule appointment';
      setError(message);
      showToast({
        title: 'Reschedule failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsRescheduleLoading(false);
    }
  };

  const rescheduleSlots = useMemo(() => {
    const selectedDay = availabilityDays.find((day) => day.dateISO === rescheduleData.selectedDate);
    if (!selectedDay) return [];

    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (selectedDay.dateISO !== todayISO) {
      return selectedDay.slots.map((slot) => ({ ...slot, timing: 'upcoming' as const }));
    }

    const currentHour = new Date().getHours();
    return selectedDay.slots.map((slot) => {
      const hour = Number(slot.time.split(':')[0]);
      if (Number.isNaN(hour)) {
        return { ...slot, timing: 'upcoming' as const };
      }
      if (hour < currentHour) {
        return { ...slot, timing: 'past' as const };
      }
      if (hour === currentHour) {
        return { ...slot, timing: 'ongoing' as const };
      }
      return { ...slot, timing: 'upcoming' as const };
    });
  }, [availabilityDays, rescheduleData.selectedDate]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!reschedulingAppointment || !session?.token) return;
      const appointment = appointments.find((app) => app.id === reschedulingAppointment);
      if (!appointment) return;

      try {
        setAvailabilityError(null);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const tzOffsetMinutes = new Date().getTimezoneOffset();
        const response = await fetch(
          `${apiBaseUrl}/api/doctors/${appointment.doctorId}/availability?tzOffsetMinutes=${tzOffsetMinutes}`
        );

        const data = (await response.json()) as { availability: AvailabilityEntry[] };
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load availability');
        }

        const days = data.availability.map((entry) => {
          const entryDate = new Date(entry.date);
          const label = entryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });
          const bookedTimes = new Set(entry.bookedTimes ?? []);
          const slots = (Array.isArray(entry.slotsJson) ? entry.slotsJson : []).map((slot) =>
            bookedTimes.has(slot.time) ? { ...slot, available: false } : slot
          );
          return {
            label,
            dateISO: `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`,
            slots,
          };
        });

        setAvailabilityDays(days);
        setRescheduleData((prev) => ({
          selectedDate: days[0]?.dateISO ?? prev.selectedDate,
          selectedTime: '',
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load availability';
        setAvailabilityError(message);
      }
    };

    fetchAvailability();
  }, [appointments, reschedulingAppointment, session?.token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'completed': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default:          return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    return {
      upcomingAppointments: appointments.filter((apt) => apt.status === 'scheduled'),
      pastAppointments: appointments.filter((apt) => apt.status !== 'scheduled'),
    };
  }, [appointments]);

  const allCalendarDates = useMemo(() => appointments.map(a => a.date), [appointments]);

  const calAppointments = useMemo(
    () => appointments.filter(a => a.date === selectedCalDate),
    [appointments, selectedCalDate],
  );

  // Auto-select first date with appointments when switching to calendar
  useEffect(() => {
    if (viewMode === 'calendar' && !selectedCalDate && allCalendarDates.length > 0) {
      setSelectedCalDate(allCalendarDates[0]);
    }
  }, [viewMode, selectedCalDate, allCalendarDates]);

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Your Appointments</h1>
        <p className="text-slate-500 text-sm md:text-base">View and manage your scheduled consultations with our doctors.</p>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mt-4 w-fit">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          <CalendarView
            dates={allCalendarDates}
            selectedDate={selectedCalDate}
            onDateSelect={setSelectedCalDate}
          />
          {calAppointments.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                Appointments on {selectedCalDate ? new Date(selectedCalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </p>
              {calAppointments.map(apt => (
                <div key={apt.id} className="bg-white border border-slate-100 rounded-xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{apt.doctorName}</p>
                    <p className="text-xs text-slate-500">{apt.specialty} — {apt.time}</p>
                    {apt.reason && <p className="text-xs text-slate-400 mt-0.5">{apt.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${apt.status === 'scheduled' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : apt.status === 'completed' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                    {apt.status === 'scheduled' && (
                      <>
                        <Link href={`/patient/appointments/${apt.id}`} className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors">
                          Join
                        </Link>
                        <button
                          onClick={() => handleRescheduleClick(apt.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelClick(apt.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedCalDate && (
            <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-400">No appointments on this day.</p>
            </div>
          )}
        </>
      ) : (
        <>
      {/* Upcoming Appointments Section */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Upcoming</h2>

        {isLoading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
            Loading appointments...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-8 text-center text-red-600">
            {error}
          </div>
        ) : upcomingAppointments.length > 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Specialty</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reason</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{appointment.doctorName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{appointment.specialty}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{formatDate(appointment.date)}</div>
                        <div className="text-slate-500">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{appointment.reason || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/patient/appointments/${appointment.id}`}
                            className="px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium text-xs transition-colors duration-200"
                          >
                            Join Session
                          </Link>
                          <button
                            onClick={() => handleRescheduleClick(appointment.id)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-xs transition-colors duration-200"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelClick(appointment.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-xs transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{appointment.specialty}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">{formatDate(appointment.date)}</p>
                    <p className="text-sm text-slate-600">{appointment.time}</p>
                    {appointment.reason && <p className="text-xs text-slate-500">Reason: {appointment.reason}</p>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/patient/appointments/${appointment.id}`}
                      className="flex-1 px-3 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium text-sm text-center transition-colors duration-200"
                    >
                      Join
                    </Link>
                    <button
                      onClick={() => handleRescheduleClick(appointment.id)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors duration-200"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelClick(appointment.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-600 font-medium mb-2">No Upcoming Appointments</p>
            <p className="text-slate-500 text-sm mb-4">Schedule a consultation with one of our doctors to get started.</p>
            <Link href="/patient/dashboard">
              <button className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium text-sm transition-colors duration-200">
                Browse Doctors
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Past Appointments Section */}
      {!isLoading && !error && pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Past Appointments</h2>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Specialty</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{appointment.doctorName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{appointment.specialty}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{formatDate(appointment.date)}</div>
                        <div className="text-slate-500">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{appointment.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{appointment.specialty}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">{formatDate(appointment.date)}</p>
                    <p className="text-sm text-slate-600">{appointment.time}</p>
                    {appointment.reason && <p className="text-xs text-slate-500">Reason: {appointment.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Cancel Modal */}
      {showCancelConfirm && cancelingAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0-14a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Cancel Appointment</h3>
            </div>

            <p className="text-slate-600 text-sm md:text-base mb-4">
              Are you sure you want to cancel this appointment? You can reschedule it anytime.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 mb-2">Reason for cancellation (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelingAppointment(null);
                  setCancelReason('');
                }}
                disabled={isCancelLoading}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={isCancelLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 md:p-8 my-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Reschedule Appointment</h3>
              <button
                onClick={() => {
                  setReschedulingAppointment(null);
                  setRescheduleData({ selectedDate: '', selectedTime: '' });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Select Date</h4>
              {availabilityError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {availabilityError}
                </div>
              ) : availabilityDays.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  No availability found for rescheduling.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availabilityDays.map((date) => {
                    const dayName = date.label.split(',')[0];
                    const dayNum = date.label.split(' ')[2];
                    return (
                      <button
                        key={date.dateISO}
                        onClick={() =>
                          setRescheduleData((prev) => ({ ...prev, selectedDate: date.dateISO, selectedTime: '' }))
                        }
                        className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                          rescheduleData.selectedDate === date.dateISO
                            ? 'bg-teal-100 text-teal-600 border border-teal-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs">{dayName}</div>
                        <div>{dayNum}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Select Time</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {rescheduleSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() =>
                      slot.available &&
                      slot.timing === 'upcoming' &&
                      setRescheduleData((prev) => ({ ...prev, selectedTime: slot.time }))
                    }
                    disabled={!slot.available || slot.timing !== 'upcoming'}
                    className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      !slot.available || slot.timing === 'past'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : slot.timing === 'ongoing'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                        : rescheduleData.selectedTime === slot.time
                        ? 'bg-teal-600 text-white border border-teal-600'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-600'
                    }`}
                  >
                    {slot.time}
                    {slot.timing !== 'upcoming' && (
                      <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide">
                        {slot.timing === 'past' ? 'Past' : 'Ongoing'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Summary */}
            {rescheduleData.selectedDate && rescheduleData.selectedTime && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-teal-900">
                  <span className="font-semibold">New appointment:</span> {rescheduleData.selectedDate} at {rescheduleData.selectedTime}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReschedulingAppointment(null);
                  setRescheduleData({ selectedDate: '', selectedTime: '' });
                }}
                disabled={isRescheduleLoading}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleConfirm}
                disabled={isRescheduleLoading || !rescheduleData.selectedDate || !rescheduleData.selectedTime}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRescheduleLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
