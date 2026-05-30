'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';

interface ConsultationLog {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string | null;
  clinicalNotes: string;
  prescriptions: string[];
}

interface PatientData {
  name: string;
  age: number | null;
  gender: string | null;
  bloodType: string | null;
  height: number | null;
  weight: number | null;
  allergies: string[];
}

export default function PatientRecords() {
  const session = useSession();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [consultations, setConsultations] = useState<ConsultationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    if (!session?.token) return;
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBaseUrl}/api/patient/records`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load records');
        }
        const data = await res.json();
        setPatient(data.patient);
        setConsultations(data.consultations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [session?.token]);

  const bmi = patient?.height && patient?.weight
    ? (patient.weight / ((patient.height / 100) * (patient.height / 100))).toFixed(1)
    : null;

  const bmiStatus = bmi
    ? (() => {
        const val = parseFloat(bmi);
        if (val < 18.5) return { label: 'Underweight', color: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (val < 25) return { label: 'Normal Weight', color: 'bg-green-50 text-green-700 border-green-200' };
        if (val < 30) return { label: 'Overweight', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
        return { label: 'Obese', color: 'bg-red-50 text-red-700 border-red-200' };
      })()
    : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl">
        <p className="text-sm text-slate-400">Loading records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Medical Records</h1>
        <p className="text-slate-500 text-sm md:text-base">View your biometrics, allergies, and consultation history.</p>
      </div>

      {/* Core Biometrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Height</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{patient?.height ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-1">cm</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Weight</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{patient?.weight ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-1">kg</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Age</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{patient?.age ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-1">years</p>
        </div>
        {bmiStatus ? (
          <div className={`border rounded-xl p-4 md:p-5 shadow-sm ${bmiStatus.color}`}>
            <p className="text-xs md:text-sm font-medium opacity-75 mb-2">BMI</p>
            <p className="text-2xl md:text-3xl font-black">{bmi}</p>
            <p className="text-xs opacity-75 mt-1">{bmiStatus.label}</p>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm bg-slate-50">
            <p className="text-xs md:text-sm font-medium text-slate-400 mb-2">BMI</p>
            <p className="text-2xl md:text-3xl font-black text-slate-300">—</p>
            <p className="text-xs text-slate-300 mt-1">N/A</p>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Allergies */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Allergies</h3>
            </div>
            {patient?.allergies && patient.allergies.length > 0 ? (
              <div className="space-y-2">
                {patient.allergies.map((a) => (
                  <div key={a} className="px-3 py-2 rounded-lg font-medium text-sm bg-red-50 text-red-700 border border-red-200">
                    [ {a} ]
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No allergies recorded.</p>
            )}
          </div>

          {/* Patient Info */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Patient Info</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-slate-500">Name:</span> <span className="text-slate-800 font-semibold">{patient?.name ?? '—'}</span></p>
              <p><span className="font-semibold text-slate-500">Gender:</span> <span className="text-slate-800">{patient?.gender ?? '—'}</span></p>
              <p><span className="font-semibold text-slate-500">Blood Type:</span> <span className="text-slate-800">{patient?.bloodType ?? '—'}</span></p>
            </div>
          </div>
        </div>

        {/* Right Column: Consultation Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Consultation History</h3>

            {consultations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No consultation records yet.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {consultations.slice(0, displayCount).map((c) => (
                    <div key={c.id} className="border border-slate-100 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{formatDate(c.date)}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">{c.doctorName}</span>
                            <span className="text-slate-500"> • {c.specialty}</span>
                          </p>
                          {c.diagnosis && (
                            <p className="text-xs font-semibold text-teal-600 mt-1">
                              Diagnosis: {c.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.clinicalNotes}</p>
                      </div>

                      {c.prescriptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prescriptions</p>
                          <div className="flex flex-wrap gap-2">
                            {c.prescriptions.map((rx) => (
                              <span key={rx} className="text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg">
                                💊 {rx}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {displayCount < consultations.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setDisplayCount((prev) => prev + 10)}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200"
                    >
                      Load More Consultations
                    </button>
                  </div>
                )}

                {displayCount >= consultations.length && consultations.length > 1 && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">All {consultations.length} consultation records loaded</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
