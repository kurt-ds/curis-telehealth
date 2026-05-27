'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
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
  // Sample appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      doctorId: '1',
      doctorName: 'Dr. Sarah Chen',
      specialty: 'Cardiology',
      date: '2024-10-28',
      time: '10:30 AM',
      status: 'scheduled',
      reason: 'Regular checkup',
    },
    {
      id: '2',
      doctorId: '2',
      doctorName: 'Dr. Marcus Thorne',
      specialty: 'General Medicine',
      date: '2024-10-29',
      time: '2:00 PM',
      status: 'scheduled',
      reason: 'Follow-up consultation',
    },
    {
      id: '3',
      doctorId: '3',
      doctorName: 'Dr. Elena Rodriguez',
      specialty: 'Pediatrics',
      date: '2024-10-25',
      time: '9:00 AM',
      status: 'completed',
      reason: 'Vaccination check',
    },
    {
      id: '4',
      doctorId: '4',
      doctorName: 'Dr. James Wilson',
      specialty: 'Neurology',
      date: '2024-10-22',
      time: '3:30 PM',
      status: 'cancelled',
      reason: 'Emergency consultation',
    },
  ]);

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

  // Sample dates for reschedule modal
  const dates = ['Monday, Oct 24', 'Tuesday, Oct 25', 'Wednesday, Oct 26', 'Thursday, Oct 27', 'Friday, Oct 28', 'Saturday, Oct 29', 'Sunday, Oct 30'];
  
  // Sample time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: true },
    { time: '9:30 AM', available: true },
    { time: '10:30 AM', available: false },
    { time: '11:15 AM', available: true },
    { time: '2:00 PM', available: true },
    { time: '2:30 PM', available: true },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: false },
  ];

  const handleCancelClick = (appointmentId: string) => {
    setCancelingAppointment(appointmentId);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelingAppointment) return;

    setIsCancelLoading(true);

    // TODO: Backend Implementation for Cancel Appointment
    // 1. DELETE /api/appointments/{appointmentId}
    // 2. Optional: POST /api/appointments/{appointmentId}/cancel with reason
    // 3. Request body (if using POST):
    //    {
    //      reason: string (optional),
    //      notes: string (optional)
    //    }
    // 4. Validate:
    //    - Appointment exists
    //    - User is authorized to cancel (patient/doctor match)
    //    - Appointment is not already completed
    //    - Appointment is not too close to cancel (e.g., < 24 hours)
    // 5. Update appointment status to 'cancelled'
    // 6. Send cancellation email to both patient and doctor
    // 7. Free up the time slot for the doctor
    // 8. Refund any prepaid fees if applicable
    // 9. Return confirmation with cancellation reference ID
    // 10. Add cancellation to activity/audit log

    setTimeout(() => {
      setIsCancelLoading(false);
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === cancelingAppointment ? { ...app, status: 'cancelled' } : app
        )
      );
      setCancelingAppointment(null);
      setShowCancelConfirm(false);
      setCancelReason('');
    }, 1500);
  };

  const handleRescheduleClick = (appointmentId: string) => {
    setReschedulingAppointment(appointmentId);
    setRescheduleData({ selectedDate: dates[0], selectedTime: '' });
  };

  const handleRescheduleConfirm = async () => {
    if (!reschedulingAppointment || !rescheduleData.selectedDate || !rescheduleData.selectedTime) return;

    setIsRescheduleLoading(true);

    // TODO: Backend Implementation for Reschedule Appointment
    // 1. PUT /api/appointments/{appointmentId} or POST /api/appointments/{appointmentId}/reschedule
    // 2. Request body:
    //    {
    //      newDate: string (ISO format),
    //      newTime: string,
    //      reason: string (optional, why rescheduling)
    //    }
    // 3. Validate:
    //    - Appointment exists and is not completed
    //    - New time slot is available
    //    - Doctor is available at new time
    //    - Appointment is not too close to reschedule (e.g., < 24 hours)
    //    - Patient doesn't have conflicting appointments
    // 4. Update appointment with new date/time
    // 5. Free up the old time slot for the doctor
    // 6. Send rescheduling confirmation email to patient
    // 7. Send reschedule notification to doctor
    // 8. Update calendar/notification system
    // 9. Return updated appointment with confirmation
    // 10. Handle conflicts (slot taken between request and confirmation)

    setTimeout(() => {
      setIsRescheduleLoading(false);
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === reschedulingAppointment
            ? { ...app, date: rescheduleData.selectedDate, time: rescheduleData.selectedTime }
            : app
        )
      );
      setReschedulingAppointment(null);
      setRescheduleData({ selectedDate: '', selectedTime: '' });
    }, 1500);
  };

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

  const upcomingAppointments = appointments.filter((apt) => apt.status === 'scheduled');
  const pastAppointments = appointments.filter((apt) => apt.status !== 'scheduled');

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Your Appointments</h1>
        <p className="text-slate-500 text-sm md:text-base">View and manage your scheduled consultations with our doctors.</p>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Upcoming</h2>

        {upcomingAppointments.length > 0 ? (
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
      {pastAppointments.length > 0 && (
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24"
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dates.map((date) => {
                  const dayName = date.split(',')[0];
                  const dayNum = date.split(' ')[2];
                  return (
                    <button
                      key={date}
                      onClick={() => setRescheduleData((prev) => ({ ...prev, selectedDate: date }))}
                      className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        rescheduleData.selectedDate === date
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
            </div>

            {/* Time Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Select Time</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setRescheduleData((prev) => ({ ...prev, selectedTime: slot.time }))}
                    disabled={!slot.available}
                    className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      !slot.available
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : rescheduleData.selectedTime === slot.time
                        ? 'bg-teal-600 text-white border border-teal-600'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-600'
                    }`}
                  >
                    {slot.time}
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
