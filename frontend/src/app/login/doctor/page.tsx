"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useState } from "react";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${API_URL}/api/auth/login/doctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Invalid email or password.");
        return;
      }

      // Store auth info in localStorage
      localStorage.setItem("curis_token", data.token);
      localStorage.setItem("curis_user", JSON.stringify(data.user));
      localStorage.setItem("curis_doctor", JSON.stringify(data.doctor));

      router.push("/doctor/dashboard");
    } catch (err) {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-16">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Doctor Login
          </h1>
          <p className="text-slate-600 text-sm">
            Sign in to your clinical workspace to manage patients and review lab results.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {apiError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium animate-fadeIn">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-700 font-medium">Remember me</span>
              </label>
              
              {/* TODO: Backend Implementation for Forgot Password */}
              {/* Implement password reset flow:
                  1. Create forgot password endpoint POST /api/auth/forgot-password
                  2. Verify doctor identity using license number
                  3. Generate reset token and store in database with expiry
                  4. Send password reset email with verification link
                  5. Create password reset form page with additional security questions
                  6. Validate token and allow password update
                  7. Log password reset events
              */}
              <button
                type="button"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-[#007f6e] hover:bg-[#006d5b] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-500">or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons - TODO: Backend Implementation */}
          {/* Implement OAuth/SSO integrations for healthcare:
              1. Google OAuth integration
              2. Apple ID integration
              3. Microsoft SSO (common in healthcare)
              4. Healthcare-specific SSO (e.g., Epic, Cerner integrations)
              5. Store OAuth tokens securely with encryption
              6. Link OAuth accounts to doctor profiles
              7. Verify doctor credentials through SSO provider
          */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-slate-700 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs">Google</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-slate-700 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 13.5c0 2.89-2.15 5.36-4.99 5.36-2.84 0-4.99-2.47-4.99-5.36 0-2.88 2.15-5.36 4.99-5.36 2.84 0 4.99 2.48 4.99 5.36zm-4.99-3.66c-1.82 0-3.3-1.46-3.3-3.27 0-1.81 1.48-3.27 3.3-3.27 1.82 0 3.3 1.46 3.3 3.27 0 1.81-1.48 3.27-3.3 3.27zm8.74-6.68h-4.24V1.08h4.24v2.08zm-4.24 4.44h4.24v14.98h-4.24V7.3zM3.7 8.94c-.16-.34-.24-.72-.24-1.14 0-1.58 1.28-2.86 2.86-2.86 1.58 0 2.86 1.28 2.86 2.86 0 .43-.08.8-.24 1.14-1.01-.81-2.33-1.3-3.78-1.3-1.45 0-2.77.49-3.78 1.3zm0 6.22c-.16-.34-.24-.72-.24-1.14 0-1.58 1.28-2.86 2.86-2.86 1.58 0 2.86 1.28 2.86 2.86 0 .43-.08.8-.24 1.14-1.01-.81-2.33-1.3-3.78-1.3-1.45 0-2.77.49-3.78 1.3z"/>
              </svg>
              <span className="text-xs">Apple</span>
            </button>
          </div>

        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-slate-600 text-sm">
            Don't have an account?{" "}
            <Link
              href="/register/doctor"
              className="text-teal-600 hover:text-teal-700 font-semibold transition-colors duration-200"
            >
              Register here
            </Link>
          </p>
        </div>

      </main>
    </div>
  );
}
