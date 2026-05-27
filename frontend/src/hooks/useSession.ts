"use client";

import { useEffect, useState } from "react";

export interface SessionUser {
  id: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export interface SessionProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;          // doctors use "name"
  avatarUrl: string | null;
}

export interface Session {
  token: string;
  user: SessionUser;
  profile: SessionProfile | null;
}

/**
 * Reads auth data from localStorage.
 * Returns null when not logged in or during SSR.
 */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("curis_token");
      const rawUser = localStorage.getItem("curis_user");
      if (!token || !rawUser) return;

      const user: SessionUser = JSON.parse(rawUser);

      // Auto-sync cookies if they are missing but localStorage has them
      if (typeof window !== "undefined") {
        const cookies = document.cookie;
        if (!cookies.includes("curis_token=") || !cookies.includes("curis_role=")) {
          setAuthCookies(token, user.role);
        }
      }

      // Pick the correct profile key based on role
      const profileKey =
        user.role === "PATIENT" ? "curis_patient" : "curis_doctor";
      const rawProfile = localStorage.getItem(profileKey);
      const profile: SessionProfile | null = rawProfile
        ? JSON.parse(rawProfile)
        : null;

      setSession({ token, user, profile });
    } catch {
      // Corrupted storage — ignore
    }
  }, []);

  return session;
}

/** Call this to set cookies for middleware validation. */
export function setAuthCookies(token: string, role: string) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  // Ensure we are in a client environment before writing to document.cookie
  if (typeof window !== "undefined") {
    document.cookie = `curis_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `curis_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

/** Call this to clear the session (logout). */
export function clearSession() {
  if (typeof window !== "undefined") {
    ["curis_token", "curis_user", "curis_patient", "curis_doctor"].forEach(
      (k) => localStorage.removeItem(k)
    );
    document.cookie = "curis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "curis_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}
