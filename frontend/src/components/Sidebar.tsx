'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession } from '@/hooks/useSession';

interface SidebarProps {
  role: 'patient' | 'doctor';
}

export default function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Dashboard',
      href: `/${role}/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z" />
        </svg>
      ),
    },
    {
      label: 'Appointments',
      href: `/${role}/appointments`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        </svg>
      ),
    },

    {
      label: 'Records',
      href: `/${role}/records`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      label: 'Profile',
      href: `/${role}/profile`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    // Create a regex pattern that matches the href and any sub-routes
    // e.g., /patient/appointments matches /patient/appointments and /patient/appointments/doctor/123
    const pattern = new RegExp(`^${href}(/.*)?$`);
    return pattern.test(pathname);
  };

  const roleLabel = role === 'patient' ? 'Curis Health\nTelehealth Platform' : 'Curis Health\nProvider Network';

  const handleLogout = () => {
    clearSession();
    setIsOpen(false);
    router.push('/login');
  };

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-[51] p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6 text-slate-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay - Mobile Only */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-lg font-black text-slate-900 mb-1">Curis</h1>
          <p className="text-xs text-slate-500 whitespace-pre-line">{roleLabel}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  active
                    ? role === 'patient'
                      ? 'bg-cyan-100 text-cyan-600'
                      : 'bg-teal-100 text-teal-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium text-sm transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
