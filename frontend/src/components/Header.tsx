"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, clearSession } from "@/hooks/useSession";

interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function Header() {
  const session = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!session?.token) return;
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiBaseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    }
  }, [session?.token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotifClick = useCallback(async (n: NotificationItem) => {
    setNotifOpen(false);
    if (n.link) router.push(n.link);
    if (!n.read && session?.token) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        await fetch(`${apiBaseUrl}/api/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.token}` },
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
  }, [session?.token, router]);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  const profileHref =
    session?.user.role === "DOCTOR" ? "/doctor/profile" : "/patient/profile";

  const displayName = session?.profile
    ? session.profile.firstName
      ? `${session.profile.firstName} ${session.profile.lastName ?? ""}`.trim()
      : session.profile.name ?? session.user.email
    : null;

  const initials = displayName
    ? displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* ── Logo ──────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform duration-200 active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-[#007f6e] flex items-center justify-center text-white shadow-sm shadow-[#007f6e]/30 group-hover:rotate-12 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#007f6e]">Curis</span>
          </Link>

          {/* ── Right Actions ──────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {session ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
                    aria-label="Notifications"
                    className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Modal */}
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <div className="absolute right-0 mt-2 w-80 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900">Notifications</p>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <div className="py-10 flex flex-col items-center justify-center text-center">
                            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm font-semibold text-slate-400">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                className={`w-full text-left block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-teal-50/40' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-teal-500' : 'bg-slate-200'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                                    {n.message && (
                                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Avatar + Dropdown */}
                <div className="relative">
                  <button
                    id="profile-menu-btn"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-all duration-200 group"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                  >
                    {/* Avatar */}
                    {session.profile?.avatarUrl ? (
                      <img
                        src={session.profile.avatarUrl}
                        alt={displayName ?? "Profile"}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-[#007f6e]/30 group-hover:ring-[#007f6e]/60 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007f6e] to-teal-400 flex items-center justify-center text-white text-xs font-black ring-2 ring-[#007f6e]/20 group-hover:ring-[#007f6e]/50 transition-all duration-200">
                        {initials}
                      </div>
                    )}

                    {/* Name (hidden on small screens) */}
                    <span className="hidden sm:block text-sm font-semibold text-slate-700 group-hover:text-slate-900 max-w-[120px] truncate">
                      {displayName}
                    </span>

                    {/* Caret */}
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                          <p className="text-xs font-black text-slate-800 truncate">{displayName}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{session.user.email}</p>
                          <span className={`inline-block mt-1.5 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                            session.user.role === "DOCTOR"
                              ? "bg-teal-100 text-[#007f6e]"
                              : "bg-indigo-100 text-indigo-600"
                          }`}>
                            {session.user.role}
                          </span>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          <Link
                            href={profileHref}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007f6e] transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </Link>

                          <Link
                            href={session.user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard"}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007f6e] transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </Link>

                          <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Not logged in */
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-[#007f6e] hover:bg-[#006d5b] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-250 shadow-sm hover:shadow active:scale-95"
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
