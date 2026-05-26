"use client";

import Link from "next/link";
import Header from "@/components/Header";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Join Curis Today
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
            Create your account and get started with our smart telehealth platform
          </p>
        </section>

        {/* Register Selection Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Patient Register Card */}
          <Link
            href="/register/patient"
            className="group"
          >
            <div className="bg-white border border-slate-100/80 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center cursor-pointer relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] text-indigo-900 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
                </svg>
              </div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100 group-hover:scale-110 transition-transform duration-300 mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors duration-200">
                  Patient Registration
                </h2>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Create an account to access your medical records, schedule appointments, and consult with specialists.
                </p>

                {/* CTA Button */}
                <div className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 group-hover:shadow-lg">
                  Get Started as Patient
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Doctor Register Card */}
          <Link
            href="/register/doctor"
            className="group"
          >
            <div className="bg-white border border-slate-100/80 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center cursor-pointer relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] text-teal-900 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.62 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                </svg>
              </div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#007f6e] shadow-sm shadow-teal-100 group-hover:scale-110 transition-transform duration-300 mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#007f6e] transition-colors duration-200">
                  Doctor Registration
                </h2>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Register your clinical credentials to join our network of specialists and manage your patient roster efficiently.
                </p>

                {/* CTA Button */}
                <div className="inline-flex items-center justify-center bg-[#007f6e] hover:bg-[#006d5b] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 group-hover:shadow-lg">
                  Get Started as Doctor
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

        </section>

        {/* Divider with text */}
        <div className="flex items-center justify-center gap-4 my-12 max-w-2xl mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-slate-100 to-transparent"></div>
          <span className="text-slate-500 text-sm font-medium">Already have an account?</span>
          <div className="flex-1 h-px bg-gradient-to-l from-slate-100 to-transparent"></div>
        </div>

        {/* Login Links */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
            <Link
              href="/login/patient"
              className="inline-flex items-center justify-center border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              Login as Patient
            </Link>
            <Link
              href="/login/doctor"
              className="inline-flex items-center justify-center border-2 border-teal-200 text-[#007f6e] hover:bg-teal-50 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              Login as Doctor
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
