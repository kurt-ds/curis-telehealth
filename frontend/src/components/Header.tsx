"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-end md:justify-between">
          {/* Logo - Hidden on Mobile, Visible on Tablet and up */}
          <div className="hidden md:flex items-center gap-8">
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
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[#007f6e] hover:bg-[#006d5b] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-250 shadow-sm hover:shadow active:scale-95"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
