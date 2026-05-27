'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  title: string;
  rating: number;
  patients: number;
  image: string;
  education: string;
  bio: string;
}

interface AvailableSlots {
  [key: string]: TimeSlot[];
}

export default function DoctorAppointmentPage() {
  const params = useParams();
  const doctorId = params.id as string;

  // Sample doctor data
  const doctor: Doctor = {
    id: '1',
    name: 'Aris Thorne',
    specialty: 'SENIOR CARDIOLOGIST',
    title: 'Dr. Aris Thorne',
    rating: 4.9,
    patients: 1240,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    education: 'Johns Hopkins University School of Medicine',
    bio: 'Specializing in non-invasive cardiology and preventive heart health. Dr. Thorne has over 15 years of experience in managing complex cardiovascular conditions.',
  };

  // Sample time slots
  const availableSlots: AvailableSlots = {
    'Monday, Oct 24': [
      { time: '9:00 AM', available: true },
      { time: '9:30 AM', available: true },
      { time: '10:30 AM', available: false },
      { time: '11:15 AM', available: true },
    ],
    'Tuesday, Oct 25': [
      { time: '9:00 AM', available: true },
      { time: '2:30 PM', available: true },
      { time: '3:45 PM', available: true },
      { time: '4:30 PM', available: false },
    ],
    'Wednesday, Oct 26': [
      { time: '10:00 AM', available: true },
      { time: '10:30 AM', available: true },
      { time: '2:00 PM', available: true },
      { time: '3:30 PM', available: true },
    ],
    'Thursday, Oct 27': [
      { time: '9:30 AM', available: true },
      { time: '11:00 AM', available: true },
      { time: '1:00 PM', available: true },
      { time: '4:00 PM', available: false },
    ],
    'Friday, Oct 28': [
      { time: '9:00 AM', available: true },
      { time: '10:30 AM', available: true },
      { time: '2:30 PM', available: true },
      { time: '3:45 PM', available: true },
    ],
    'Saturday, Oct 29': [
      { time: '10:00 AM', available: true },
      { time: '11:30 AM', available: true },
      { time: '2:00 PM', available: true },
      { time: '3:30 PM', available: true },
    ],
    'Sunday, Oct 30': [
      { time: '10:00 AM', available: true },
      { time: '11:00 AM', available: true },
      { time: '2:00 PM', available: true },
    ],
  };

  const [selectedDate, setSelectedDate] = useState('Monday, Oct 24');
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [isConfirming, setIsConfirming] = useState(false);

  const dates = Object.keys(availableSlots);
  const slots = availableSlots[selectedDate];

  const handleConfirm = () => {
    setIsConfirming(true);
    // TODO: Backend Implementation for Appointment Booking
    // 1. Create POST /api/appointments endpoint
    // 2. Request body:
    //    {
    //      doctorId: string,
    //      patientId: string (from auth),
    //      appointmentDate: string (ISO format),
    //      appointmentTime: string,
    //      reason: string (optional),
    //      notes: string (optional)
    //    }
    // 3. Validate:
    //    - Time slot is still available (check concurrent bookings)
    //    - Patient doesn't have conflicting appointments
    //    - Doctor is available on that date/time
    // 4. Create appointment record in database
    // 5. Send confirmation email to patient
    // 6. Send notification to doctor
    // 7. Add to calendar/notification system
    // 8. Return appointment confirmation with booking reference ID
    // 9. Handle errors (slot taken, validation failures, etc.)
    // 10. Implement payment/insurance verification if needed
    
    setTimeout(() => {
      setIsConfirming(false);
      alert(`Appointment booked with ${doctor.name} on ${selectedDate} at ${selectedTime}`);
    }, 1500);
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
        <p className="text-slate-600">Choose your preferred time for a consultation with {doctor.title}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Doctor Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {/* Doctor Image */}
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-full h-64 object-cover"
            />

            {/* Doctor Info */}
            <div className="p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-1">{doctor.title}</h2>
              <p className="text-sm font-semibold text-teal-600 mb-3">{doctor.specialty}</p>

              {/* Education */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Education</p>
                <p className="text-sm text-slate-700">{doctor.education}</p>
              </div>

              {/* Bio */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Bio</p>
                <p className="text-sm text-slate-700 leading-relaxed">{doctor.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Available Slots */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Available Slots</h3>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-700">Oct 24 - Oct 30, 2024</span>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Date Pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {dates.map((date) => {
                const dayName = date.split(',')[0];
                const dayNum = date.split(' ')[2];
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                      selectedDate === date
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

            {/* Time Slots */}
            <div className="space-y-6">
              {/* Morning Slots */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-slate-900">Morning</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.slice(0, 4).map((slot) => (
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

              {/* Afternoon Slots */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-slate-900">Afternoon</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.slice(4).map((slot) => (
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
                      Selected: {selectedDate} at {selectedTime}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
