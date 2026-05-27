'use client';

import { useState, useMemo } from 'react';

interface Biometric {
  height: number; // cm
  weight: number; // kg
  birthday: string; // ISO date string
}

interface Allergy {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

interface ConsultationLog {
  id: string;
  date: string; // ISO date string
  doctorName: string;
  specialty: string;
  clinicalNotes: string;
  biometrics?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
  };
}

export default function PatientRecords() {
  const [displayedConsultations, setDisplayedConsultations] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sample patient data
  const biometric: Biometric = {
    height: 178,
    weight: 75,
    birthday: '1990-03-15',
  };

  const allergies: Allergy[] = [
    { id: '1', name: 'Penicillin', severity: 'severe' },
    { id: '2', name: 'Peanuts', severity: 'severe' },
    { id: '3', name: 'Shellfish', severity: 'moderate' },
  ];

  const medications: Medication[] = [
    { id: '1', name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily' },
    { id: '2', name: 'Metformin', dosage: '1000mg', frequency: 'Once daily' },
    { id: '3', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  ];

  const consultationLogs: ConsultationLog[] = [
    {
      id: '1',
      date: '2026-05-25',
      doctorName: 'Dr. Alex Mercer',
      specialty: 'Cardiology',
      clinicalNotes:
        'Patient presents with mild palpitations and fatigue. Conducted cardiovascular examination. ECG shows normal sinus rhythm with no acute abnormalities. Blood pressure slightly elevated at 145/92 mmHg. Recommended increasing daily water intake and reducing caffeine consumption. Prescribed continuation of Lisinopril with dose adjustment to 15mg daily. Follow-up appointment scheduled in 2 weeks to monitor blood pressure response.',
      biometrics: {
        blood_pressure: '145/92',
        heart_rate: 78,
        temperature: 98.6,
      },
    },
    {
      id: '2',
      date: '2026-05-10',
      doctorName: 'Dr. Sarah Chen',
      specialty: 'General Medicine',
      clinicalNotes:
        'Routine checkup. Patient reports good overall health with no major complaints. Physical examination unremarkable. Weight stable at 75 kg, BMI 23.7 (normal range). Lab work ordered to check glucose and cholesterol levels given family history of diabetes. Continue current medication regimen. Lifestyle modifications advised: increase physical activity to 150 minutes per week.',
      biometrics: {
        blood_pressure: '138/88',
        heart_rate: 72,
        temperature: 98.4,
      },
    },
    {
      id: '3',
      date: '2026-04-28',
      doctorName: 'Dr. James Wilson',
      specialty: 'Neurology',
      clinicalNotes:
        'Patient consulted for occasional migraines. Neurological examination performed, no focal deficits noted. Discussion about migraine triggers - patient identified stress and irregular sleep as main contributors. Started preventive therapy with Propranolol 40mg daily. Advised to maintain consistent sleep schedule and implement stress reduction techniques. Migraine diary recommended to track patterns.',
      biometrics: {
        blood_pressure: '135/85',
        heart_rate: 70,
        temperature: 98.5,
      },
    },
    {
      id: '4',
      date: '2026-04-10',
      doctorName: 'Dr. Elena Rodriguez',
      specialty: 'General Medicine',
      clinicalNotes:
        'Follow-up visit for hypertension management. Current blood pressure reading 142/90 mmHg. Adjusted medication dosage. Patient educated on DASH diet and importance of regular exercise. Instructed to monitor blood pressure at home daily and keep a log. Schedule follow-up appointment in 4 weeks.',
      biometrics: {
        blood_pressure: '142/90',
        heart_rate: 76,
        temperature: 98.3,
      },
    },
  ];

  // Calculate age from birthday
  const calculateAge = (birthday: string) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Calculate BMI
  const calculateBMI = () => {
    const heightInMeters = biometric.height / 100;
    return (biometric.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Determine BMI status
  const getBMIStatus = () => {
    const bmi = parseFloat(calculateBMI());
    if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (bmi < 25) return { label: 'Normal Weight', color: 'bg-green-50 text-green-700 border-green-200' };
    if (bmi < 30) return { label: 'Overweight', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: 'Obese', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const age = useMemo(() => calculateAge(biometric.birthday), []);
  const bmi = calculateBMI();
  const bmiStatus = getBMIStatus();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    // TODO: Backend Implementation for Pagination
    // 1. GET /api/patient/consultations?limit=10&offset={displayedConsultations}
    //    - Implement cursor-based or offset-based pagination
    //    - Return next batch of consultations
    //    - Include total count for "Load More" visibility
    // 2. Request parameters:
    //    - limit: number of records to fetch (default 10)
    //    - offset: how many records to skip (default 0)
    //    - Optional: filters for date range, doctor, specialty
    // 3. Response:
    //    {
    //      consultations: [...],
    //      total: number,
    //      hasMore: boolean
    //    }
    // 4. Performance:
    //    - Use database indexing on date for efficient sorting
    //    - Cache paginated results briefly
    //    - Consider implementing lazy loading

    // Simulate API delay
    setTimeout(() => {
      setIsLoadingMore(false);
      setDisplayedConsultations((prev) => prev + 3); // Load 3 more records
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Medical Records</h1>
        <p className="text-slate-500 text-sm md:text-base">View your biometrics, medications, allergies, and consultation history.</p>
      </div>

      {/* Core Biometrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {/* Height */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Height</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{biometric.height}</p>
          <p className="text-xs text-slate-500 mt-1">cm</p>
        </div>

        {/* Weight */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Weight</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{biometric.weight}</p>
          <p className="text-xs text-slate-500 mt-1">kg</p>
        </div>

        {/* Age */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Age</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{age}</p>
          <p className="text-xs text-slate-500 mt-1">years</p>
        </div>

        {/* BMI */}
        <div className={`border rounded-xl p-4 md:p-5 shadow-sm ${bmiStatus.color}`}>
          <p className="text-xs md:text-sm font-medium opacity-75 mb-2">BMI</p>
          <p className="text-2xl md:text-3xl font-black">{bmi}</p>
          <p className="text-xs opacity-75 mt-1">{bmiStatus.label}</p>
        </div>
      </div>

      {/* Main Layout: Left Column (Clinical Watchlist) + Right Column (Consultation Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Clinical Watchlist */}
        <div className="lg:col-span-1 space-y-6">
          {/* Allergies Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Allergies</h3>
            </div>

            <div className="space-y-2">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className={`px-3 py-2 rounded-lg font-medium text-sm border ${
                    allergy.severity === 'severe'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : allergy.severity === 'moderate'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}
                >
                  [ {allergy.name} ]
                </div>
              ))}
            </div>
          </div>

          {/* Current Medications Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Current Medications</h3>
            </div>

            <div className="space-y-2">
              {medications.map((med) => (
                <div key={med.id} className="px-3 py-2 rounded-lg font-medium text-sm bg-teal-50 text-teal-700 border border-teal-200">
                  <div>[ {med.name} ]</div>
                  <div className="text-xs opacity-75 font-normal mt-0.5">
                    {med.dosage} • {med.frequency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Consultation Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Consultation History</h3>

            <div className="space-y-4">
              {consultationLogs.slice(0, displayedConsultations).map((consultation) => (
                <div key={consultation.id} className="border border-slate-100 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
                  {/* Header: Date & Doctor */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(consultation.date)}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="font-medium">{consultation.doctorName}</span>
                        <span className="text-slate-500"> • {consultation.specialty}</span>
                      </p>
                    </div>
                    {consultation.biometrics && (
                      <div className="text-xs text-slate-600">
                        <p>BP: {consultation.biometrics.blood_pressure}</p>
                        <p>HR: {consultation.biometrics.heart_rate} bpm</p>
                      </div>
                    )}
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{consultation.clinicalNotes}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {displayedConsultations < consultationLogs.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>Load More Consultations</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* All Records Loaded */}
            {displayedConsultations >= consultationLogs.length && consultationLogs.length > 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">All {consultationLogs.length} consultation records loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backend Implementation Notes */}
      {/* 
      TODO: Patient Records Backend Implementation
      
      1. GET /api/patient/biometrics
         - Fetch patient height, weight, birthday
         - Used to calculate age and BMI on frontend
         
      2. GET /api/patient/allergies
         - Fetch list of allergies with severity levels (mild, moderate, severe)
         - Return: [{ id, name, severity }]
         
      3. GET /api/patient/medications
         - Fetch current medications with dosage and frequency
         - Return: [{ id, name, dosage, frequency }]
         
      4. GET /api/patient/consultations
         - Fetch all consultation logs with pagination support
         - Return: [{ id, date, doctorName, specialty, clinicalNotes, biometrics: { blood_pressure, heart_rate, temperature } }]
         - Support filtering by date range, doctor, specialty
         - Support sorting by date (newest first)
         
      5. Validation & Security
         - Verify user is authorized to view their own records
         - Ensure data is encrypted in transit (HTTPS)
         - Log access to sensitive medical records for audit trail
         
      6. Performance Optimization
         - Cache biometric and medication data (they change infrequently)
         - Paginate consultation logs (e.g., 10 per page)
         - Consider implementing search/filter on consultations by doctor name or keyword
         
      7. Data Considerations
         - All dates should be ISO 8601 format (YYYY-MM-DD)
         - Biometrics (height, weight) should be numeric
         - Clinical notes can be long text - consider max length on backend
      */}
    </div>
  );
}
