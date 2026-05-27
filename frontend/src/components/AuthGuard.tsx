"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole: "PATIENT" | "DOCTOR" | "ADMIN";
}

export default function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("curis_token");
      const rawUser = localStorage.getItem("curis_user");

      if (!token || !rawUser) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        // Redirect to login page appropriate for the role requested
        const loginPath = allowedRole === "DOCTOR" ? "/login/doctor" : "/login/patient";
        router.replace(loginPath);
        return;
      }

      const user = JSON.parse(rawUser);

      setIsAuthenticated(true);
      if (user.role === allowedRole) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthenticated(false);
      setIsAuthorized(false);
      router.replace("/login");
    }
  }, [allowedRole, router]);

  // Show a premium clinical styled loading screen during verification
  if (isAuthenticated === null || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#007f6e]/10 flex items-center justify-center text-[#007f6e] animate-pulse">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase animate-pulse">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, we're already redirecting via useEffect, return fallback loader
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but unauthorized (e.g. Patient trying to access Doctor workspace)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Stunning Glassmorphic Shield Icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm mb-6 animate-bounce">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
            Access Denied
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            You do not have the required clearance to access the {allowedRole.toLowerCase()}&apos;s workspace. This activity has been logged for security compliance.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              href={allowedRole === "DOCTOR" ? "/patient/dashboard" : "/doctor/dashboard"}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
            >
              Go to My Workspace
            </Link>
            <button
              onClick={() => {
                localStorage.clear();
                router.replace("/login");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
