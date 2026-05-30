'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

interface AIRecommendation {
  recommendation: string;
  specialty: string;
  doctorsConsulted: number;
  symptoms: string;
  model: string;
}

export default function PatientDashboard() {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAIResult] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        setDoctorsError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/doctors`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load doctors');
        }

        const data = (await response.json()) as { doctors: Doctor[] };
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load doctors';
        setDoctorsError(message);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAIResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symptoms: symptoms.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI recommendation');
      }

      const data: AIRecommendation = await response.json();
      setAIResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('AI Analysis Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Patient Dashboard</h1>
        <p className="text-slate-500 text-sm md:text-base">Welcome back. Manage your health and consultations from one central hub.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Symptom Checker & Emergency Contact */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Recommender */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900">AI Doctor Recommender</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Describe your symptoms and we'll recommend the right specialist for you.
            </p>

            <textarea
              placeholder="Describe your symptoms... e.g., persistent dry cough for 3 days, mild fever, and fatigue."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none h-32 mb-4"
              disabled={isAnalyzing}
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symptoms.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5S11 13.33 11 12.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
                  </svg>
                  Get Recommendation
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              <p className="text-xs text-orange-700">AI-assisted, not a diagnosis. Please consult a professional for medical emergencies.</p>
            </div>

            {/* AI Result */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {aiResult && (
              <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <p className="text-sm font-semibold text-cyan-900">Recommendation</p>
                </div>
                <p className="text-sm text-cyan-800 whitespace-pre-wrap mb-3">{aiResult.recommendation}</p>
              </div>
            )}

            {/* Clear Button */}
            {aiResult && (
              <button
                onClick={() => {
                  setSymptoms('');
                  setAIResult(null);
                }}
                className="w-full mt-3 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-200"
              >
                Start New Analysis
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Doctor Directory */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            {/* Header */}
              <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Doctor Directory</h2>
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <svg className="absolute left-3 top-3 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">All Specialties</option>
                  {[...new Set(doctors.map((d) => d.specialty))].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter badge */}
            {aiResult?.specialty && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-full">
                  Recommended: {aiResult.specialty}
                </span>
                <button
                  onClick={() => setAIResult((prev) => prev ? { ...prev, specialty: '' } : null)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Doctors Grid */}
            {(() => {
              const filtered = doctors.filter((d) => {
                const matchesSearch = !searchQuery.trim() ||
                  d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesAiSpecialty = !aiResult?.specialty ||
                  d.specialty.toLowerCase() === aiResult.specialty.toLowerCase();
                const matchesDropdown = !specialtyFilter ||
                  d.specialty === specialtyFilter;
                return matchesSearch && matchesAiSpecialty && matchesDropdown;
              });

              const recommendedIds = aiResult?.specialty
                ? new Set(doctors.filter((d) => d.specialty.toLowerCase() === aiResult.specialty.toLowerCase()).map((d) => d.id))
                : new Set<string>();

              return (
                <>
                  {isLoadingDoctors ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="border border-slate-100 rounded-2xl p-4 animate-pulse">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-16 h-16 rounded-full bg-slate-100" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-100 rounded w-3/4" />
                              <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="h-9 bg-slate-100 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : doctorsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {doctorsError}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {aiResult?.specialty
                        ? `No ${aiResult.specialty} specialists available right now.`
                        : 'No available doctors found right now.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filtered.map((doctor) => {
                        const isRecommended = recommendedIds.has(doctor.id);
                        return (
                          <div
                            key={doctor.id}
                            className={`border rounded-2xl p-4 hover:shadow-md transition-all duration-200 ${
                              isRecommended ? 'border-cyan-400 ring-1 ring-cyan-300 bg-cyan-50/30' : 'border-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              {doctor.image ? (
                                <img
                                  src={doctor.image}
                                  alt={doctor.name}
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div
                                  className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                                  style={{ background: `hsl(${(doctor.id.charCodeAt(0) * 40) % 360}, 50%, 45%)` }}
                                >
                                  {doctor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                                <p className={`text-xs font-medium inline-block px-2 py-1 rounded-full mt-1 ${
                                  isRecommended
                                    ? 'text-cyan-700 bg-cyan-100'
                                    : 'text-cyan-600 bg-cyan-50'
                                }`}>
                                  {doctor.specialty}
                                </p>
                                {isRecommended && (
                                  <span className="text-[10px] font-bold text-cyan-600 ml-2">Recommended</span>
                                )}
                              </div>
                            </div>

                            <Link href={`/patient/appointments/doctor/${doctor.id}`}>
                              <button className="w-full px-4 py-2 border border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-semibold rounded-xl transition-all duration-200">
                                View Slot Schedule
                              </button>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Backend Implementation Comment */}
            {/* 
            TODO: Doctor Listings Backend Implementation
            1. Create GET /api/doctors endpoint to fetch list of available doctors
            2. Implement filtering by:
               - Specialty/department
               - Rating/reviews
               - Availability
               - Location
               - Insurance accepted
            3. Add pagination for large lists (e.g., 20 doctors per page)
            4. Implement search functionality with full-text search
            5. Cache doctor data for performance
            6. Sort by:
               - Rating (highest first)
               - Availability (soonest appointment)
               - Relevance (based on patient's condition/specialty)
            7. Track doctor views/clicks for analytics
            8. Add "Book Appointment" functionality:
               - Show available time slots
               - Handle appointment booking and confirmation
               - Send confirmation emails to both patient and doctor
            9. Implement doctor profile details (full bio, credentials, education)
            10. Add reviews and testimonials section
            11. Handle doctor unavailability/holidays
            12. Implement waiting list for fully booked doctors
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
