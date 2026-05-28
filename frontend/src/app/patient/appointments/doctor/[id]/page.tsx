'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  title: string;
  image: string;
  education: string;
  bio: string;
}

interface AvailabilityEntry {
  date: string;
  slotsJson: TimeSlot[];
}

interface AvailabilityDay {
  label: string;
  dateISO: string;
  slots: TimeSlot[];
}

export default function DoctorAppointmentPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const session = useSession();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [selectedDateISO, setSelectedDateISO] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctor = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [doctorResponse, availabilityResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/doctors/${doctorId}`),
          fetch(`${apiBaseUrl}/api/doctors/${doctorId}/availability`),
        ]);

        if (!doctorResponse.ok) {
          const errorData = await doctorResponse.json();
          throw new Error(errorData.error || 'Failed to load doctor');
        }

        if (!availabilityResponse.ok) {
          const errorData = await availabilityResponse.json();
          throw new Error(errorData.error || 'Failed to load availability');
        }

        const doctorData = (await doctorResponse.json()) as { doctor: Doctor };
        const availabilityData = (await availabilityResponse.json()) as {
          availability: AvailabilityEntry[];
        };

        setDoctor(doctorData.doctor);

        const days = availabilityData.availability.map((entry) => {
          const entryDate = new Date(entry.date);
          const label = entryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });
          return {
            label,
            dateISO: entryDate.toISOString().slice(0, 10),
            slots: Array.isArray(entry.slotsJson) ? entry.slotsJson : [],
          };
        });

        setAvailabilityDays(days);
        const initialDate = days[0]?.dateISO ?? '';
        setSelectedDateISO(initialDate);
        const initialSlot = days[0]?.slots.find((slot) => slot.available);
        setSelectedTime(initialSlot?.time ?? '');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load doctor data';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctor();
  }, [apiBaseUrl, doctorId]);

  const dates = useMemo(() => availabilityDays, [availabilityDays]);
  const slots = useMemo(() => {
    return availabilityDays.find((day) => day.dateISO === selectedDateISO)?.slots ?? [];
  }, [availabilityDays, selectedDateISO]);

  const handleConfirm = () => {
    setIsConfirming(true);
    setBookingError(null);
    setBookingSuccess(null);

    const selected = dates.find((date) => date.dateISO === selectedDateISO);
    if (!selected || !doctor) {
      setIsConfirming(false);
      return;
    }

    const submitBooking = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.token ?? ''}`,
          },
          body: JSON.stringify({
            doctorId: doctor.id,
            slotDate: selected.dateISO,
            slotTime: selectedTime,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to book appointment');
        }

        setBookingSuccess(`Appointment booked with ${doctor.name} on ${selected.label} at ${selectedTime}.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to book appointment';
        setBookingError(message);
      } finally {
        setIsConfirming(false);
      }
    };

    submitBooking();
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Back Button */}
      <Link href="/patient/appointments">
        <button className="flex items-center gap-2 mb-6 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Your Appointments
        </button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Book Your Appointment</h1>
        <p className="text-slate-600">
          Choose your preferred time for a consultation with {doctor?.title ?? 'your doctor'}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Doctor Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-full h-64 bg-slate-100" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl">
                {error}
              </div>
            ) : doctor ? (
              <>
                {doctor.image ? (
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-slate-100 text-slate-500">
                    No photo available
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{doctor.title}</h2>
                  <p className="text-sm font-semibold text-teal-600 mb-3">{doctor.specialty}</p>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Education</p>
                    <p className="text-sm text-slate-700">
                      {doctor.education || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Bio</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {doctor.bio || 'No bio available yet.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-sm text-slate-600">Doctor not found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Available Slots */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Available Slots</h3>

            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-slate-100 rounded" />
                <div className="h-24 bg-slate-100 rounded" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : dates.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No availability posted yet.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200" aria-label="Previous week">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-slate-700">Next 7 days</span>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200" aria-label="Next week">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {dates.map((date) => {
                    const dayName = date.label.split(',')[0];
                    const dayNum = date.label.split(' ')[2];
                    return (
                      <button
                        key={date.dateISO}
                        onClick={() => setSelectedDateISO(date.dateISO)}
                        className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                          selectedDateISO === date.dateISO
                            ? 'bg-teal-100 text-teal-600 border border-teal-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">{dayName}</span>
                        <span>{dayNum}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-semibold text-slate-900">Morning</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {slots
                        .filter((slot) => slot.time < '12:00')
                        .map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              !slot.available
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : selectedTime === slot.time
                                ? 'bg-teal-600 text-white border border-teal-600'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-600'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-semibold text-slate-900">Afternoon</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {slots
                        .filter((slot) => slot.time >= '12:00')
                        .map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              !slot.available
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : selectedTime === slot.time
                                ? 'bg-teal-600 text-white border border-teal-600'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-600'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}

                        {/* Confirmation Card */}
            <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ready to confirm?</p>
                    <p className="text-lg font-black">
                      {selectedDateISO && selectedTime
                        ? `Selected: ${dates.find((date) => date.dateISO === selectedDateISO)?.label ?? ''} at ${selectedTime}`
                        : 'Select a time slot to continue'}
                    </p>
                  </div>
                </div>
              </div>

              {bookingError && (
                <p className="mt-4 text-sm text-red-300">{bookingError}</p>
              )}
              {bookingSuccess && (
                <p className="mt-4 text-sm text-emerald-200">{bookingSuccess}</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={
                  isConfirming ||
                  !selectedDateISO ||
                  !selectedTime ||
                  !session?.token
                }
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </>
                ) : (
                  session?.token ? 'Confirm Appointment' : 'Sign in to book'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
