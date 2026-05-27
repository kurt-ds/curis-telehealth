"use client";

import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          
          {/* Stunning glowing circular medical grid element */}
          <div className="relative w-40 h-40 mx-auto mb-10">
            {/* Pulsing ring background */}
            <div className="absolute inset-0 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center animate-ping opacity-60" />
            <div className="absolute inset-2 rounded-full bg-teal-50 border border-teal-100/60 flex items-center justify-center animate-pulse" />
            
            {/* The main core graphic */}
            <div className="absolute inset-4 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-lg shadow-slate-100/50">
              <span className="text-6xl font-black tracking-tighter text-[#007f6e] select-none">
                404
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            The medical folder or clinical workspace you are trying to view does not exist or has been relocated to another department.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#007f6e] hover:bg-[#006d5b] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
            >
              Go to Home Page
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
