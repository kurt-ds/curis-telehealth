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

/** Call this to clear the session (logout). */
export function clearSession() {
  ["curis_token", "curis_user", "curis_patient", "curis_doctor"].forEach(
    (k) => localStorage.removeItem(k)
  );
}
