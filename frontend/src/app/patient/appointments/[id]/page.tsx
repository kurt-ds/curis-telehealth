'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

interface AppointmentData {
  id: string;
  doctorId: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
}

export default function PatientAppointmentSession() {
  const params = useParams();
  const session = useSession();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!session?.token) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const found = (data.appointments as AppointmentData[]).find(
            (a: AppointmentData) => a.id === appointmentId
          );
          if (found) setAppointment(found);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [session?.token, appointmentId]);

  const doctor = appointment?.doctor;
  const scheduledDate = appointment ? new Date(appointment.scheduledAt) : null;
  const canJoin = !!scheduledDate && now >= scheduledDate.getTime() - 30 * 60 * 1000 && now <= scheduledDate.getTime() + 60 * 60 * 1000;

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

      {loading ? (
        <div className="text-sm text-slate-400">Loading appointment...</div>
      ) : !appointment ? (
        <div className="text-sm text-red-500">Appointment not found.</div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-3">
              Consultation with {doctor?.name || 'Doctor'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {doctor && (
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">
                  {doctor.specialization}
                </span>
              )}
              <span className="text-slate-500">Appointment ID: {appointmentId}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden relative flex flex-col items-center justify-center gap-4">
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
                  {canJoin && (
                    <a
                      href="https://meet.jit.si/curis-telehealth"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition-all duration-200 hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.268A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      Join Video Consultation
                    </a>
                  )}
                  {doctor && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/70 text-white px-4 py-2 rounded-full">
                      <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {doctor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{doctor.name}</p>
                        <p className="text-xs text-slate-200">{doctor.specialization}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {scheduledDate && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Appointment Details</h3>
                  <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span className="text-slate-900">
                        {scheduledDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="text-slate-900">
                        {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="text-slate-900">{appointment.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
