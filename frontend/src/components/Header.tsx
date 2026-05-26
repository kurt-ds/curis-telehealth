"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 group transition-transform duration-200 active:scale-95"
            >
              {/* Sleek clinical medical plus/circle icon */}
              <div className="w-8 h-8 rounded-lg bg-[#007f6e] flex items-center justify-center text-white shadow-sm shadow-[#007f6e]/30 group-hover:rotate-12 transition-transform duration-300">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-[#007f6e]">
                Curis
              </span>
            </Link>

            {/* Premium navigation link for AI consultation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/ai"
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-[#007f6e] hover:bg-[#007f6e] hover:text-white transition-all duration-250 border border-teal-100/50 shadow-sm shadow-teal-500/5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#007f6e] animate-pulse" />
                AI Symptom Checker
              </Link>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Mobile View AI Link */}
            <Link
              href="/ai"
              className="md:hidden inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-teal-50 text-[#007f6e]"
            >
              AI Consult
            </Link>

            {/* Notification Bell */}
            <button 
              type="button"
              className="relative p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200 cursor-pointer active:scale-90"
              aria-label="View notifications"
            >
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse" />
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="relative group cursor-pointer active:scale-95 transition-transform">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"
                alt="Doctor Profile Avatar"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
