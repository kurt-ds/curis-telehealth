"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useState, useEffect } from "react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

export default function LandingPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBaseUrl}/api/doctors`);
        if (!res.ok) return;
        const data = await res.json();
        setDoctors(data.doctors.slice(0, 4));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ─── Hero Banner ─────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006d5b] to-[#008f7a] shadow-lg shadow-teal-900/10 mb-8 py-12 px-6 sm:py-16 sm:px-12 text-center text-white">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "20px 20px"
            }}
          />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Precision Healthcare for Everyone.
            </h1>
            <p className="text-base sm:text-lg text-teal-50 max-w-xl mx-auto mb-8 font-light leading-relaxed opacity-90">
              Experience a clinical-grade health ecosystem designed for seamless interaction between patients and providers. Trust-driven, data-backed, and patient-focused.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => showToast("Explore Services: Coming soon!")}
                className="inline-flex items-center justify-center bg-white text-[#007f6e] hover:bg-teal-50 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              >
                Explore Services
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-white/60 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Portal Selection Cards ─────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] text-indigo-900 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
              </svg>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-6 tracking-tight">
                Are you a Patient?
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed font-normal">
                Access your medical history, schedule immediate appointments, and chat with your care team in a secure environment.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all duration-200 group-hover:bg-slate-100/50">
                  <div className="text-2xl font-black text-slate-800">12k+</div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">ACTIVE PATIENTS</div>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all duration-200 group-hover:bg-slate-100/50">
                  <div className="text-2xl font-black text-slate-800">4.9/5</div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">SATISFACTION</div>
                </div>
              </div>
            </div>
            <Link
              href="/login/patient"
              className="mt-8 w-full bg-[#007f6e] hover:bg-[#006d5b] text-white text-sm font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-250 shadow-sm hover:shadow active:scale-[0.98]"
            >
              Enter Patient Portal
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] text-teal-900 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.62 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#007f6e] shadow-sm shadow-teal-100 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-6 tracking-tight">
                Are you a Doctor?
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed font-normal">
                Manage your patient roster, review lab results with AI-assisted insights, and optimize your clinical workflow.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all duration-200 group-hover:bg-slate-100/50">
                  <div className="text-2xl font-black text-slate-800">850+</div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">PRACTITIONERS</div>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all duration-200 group-hover:bg-slate-100/50">
                  <div className="text-2xl font-black text-slate-800">15min</div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">AVG RESPONSE</div>
                </div>
              </div>
            </div>
            <Link
              href="/login/doctor"
              className="mt-8 w-full bg-[#007f6e] hover:bg-[#006d5b] text-white text-sm font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-250 shadow-sm hover:shadow active:scale-[0.98]"
            >
              Access Clinical Workspace
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ─── Our Doctors Section ──────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Our Doctors
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 leading-relaxed">
              Consult with world-class specialists from our certified network.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    {doctor.image ? (
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="object-cover w-full h-full filter grayscale contrast-115 brightness-95 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm font-semibold">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-[#007f6e] transition-colors duration-200">
                        {doctor.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="bg-slate-50 border-t border-slate-200/60 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-[0.25em] block mb-4">
            CURIS INSTITUTIONAL HEALTH NETWORK
          </span>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6">
            <button onClick={() => showToast("Privacy Policy: Redirected to Home page.")} className="text-xs text-slate-500 hover:text-[#007f6e] transition-colors duration-150 font-medium cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => showToast("Terms of Service: Redirected to Home page.")} className="text-xs text-slate-500 hover:text-[#007f6e] transition-colors duration-150 font-medium cursor-pointer">
              Terms of Service
            </button>
            <button onClick={() => showToast("Compliance Guidelines: Redirected to Home page.")} className="text-xs text-slate-500 hover:text-[#007f6e] transition-colors duration-150 font-medium cursor-pointer">
              Compliance
            </button>
            <button onClick={() => showToast("Support / Contact Us: Redirected to Home page.")} className="text-xs text-slate-500 hover:text-[#007f6e] transition-colors duration-150 font-medium cursor-pointer">
              Contact
            </button>
          </div>
          <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
            © 2026 Curis Health Systems. All rights reserved.
          </p>
        </div>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-slate-900 text-slate-100 text-xs font-semibold py-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
