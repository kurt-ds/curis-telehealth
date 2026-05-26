"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────
interface RecommendationResponse {
  recommendation: string;
  doctorsConsulted: number;
  symptoms: string;
}

// ─── Sub-components ───────────────────────────────────────────────
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-curis-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function StatusBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/20">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse-slow" />
      {count} doctor{count !== 1 ? "s" : ""} consulted
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function HomePage() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error: ${res.status}`);
      }

      const data: RecommendationResponse = await res.json();
      setResult(data);

      // Smooth-scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Is the backend running?"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const exampleSymptoms = [
    "I have chest pain, shortness of breath, and my left arm feels numb.",
    "I've had a persistent rash on my arms for 2 weeks with itching.",
    "Severe migraines, blurred vision, and dizziness for the past 3 days.",
  ];

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Background decorative orbs */}
      <div
        aria-hidden="true"
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(52,164,253,0.4) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(15,215,194,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-curis-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-teal animate-pulse-slow" />
            AI-Powered Telehealth
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Meet </span>
            <span className="text-gradient">Curis</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Describe your symptoms and our AI will match you with the right
            specialist from our clinic — instantly.
          </p>
        </header>

        {/* ── Symptom Form ────────────────────────────────────────── */}
        <section aria-label="Symptom submission form">
          <form
            onSubmit={handleSubmit}
            className="glass rounded-2xl p-6 sm:p-8 glow-blue animate-slide-up"
          >
            <label
              htmlFor="symptoms-input"
              className="block text-sm font-semibold text-slate-300 mb-3"
            >
              Describe your symptoms
            </label>

            <textarea
              id="symptoms-input"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I have a persistent headache, fever of 38°C, and a stiff neck for the past 24 hours…"
              rows={5}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-curis-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />

            {/* Example chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">
                Try an example:
              </span>
              {exampleSymptoms.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSymptoms(ex)}
                  className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-curis-300 hover:border-curis-600 transition-all duration-150 cursor-pointer"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>

            <button
              id="submit-symptoms-btn"
              type="submit"
              disabled={isLoading || !symptoms.trim()}
              className="mt-5 w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #1a83f2 0%, #0fd7c2 100%)",
                boxShadow: isLoading
                  ? "none"
                  : "0 4px 24px rgba(26,131,242,0.35)",
              }}
            >
              {isLoading ? (
                <>
                  <LoadingDots />
                  <span>Analysing symptoms…</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  Get Doctor Recommendation
                </>
              )}
            </button>
          </form>
        </section>

        {/* ── Error State ─────────────────────────────────────────── */}
        {error && (
          <div
            role="alert"
            className="mt-6 glass border border-red-500/30 rounded-xl p-5 text-red-400 text-sm animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="font-semibold text-red-300 mb-1">
                  Connection Error
                </p>
                <p>{error}</p>
                <p className="mt-2 text-slate-500 text-xs">
                  Make sure the backend is running:{" "}
                  <code className="bg-slate-800 px-1 py-0.5 rounded">
                    docker compose up --build
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Result Card ─────────────────────────────────────────── */}
        {result && (
          <div
            ref={resultRef}
            id="recommendation-result"
            className="mt-6 glass rounded-2xl p-6 sm:p-8 glow-teal animate-slide-up"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                AI Recommendation
              </h2>
              <StatusBadge count={result.doctorsConsulted} />
            </div>

            {/* Submitted symptoms chip */}
            <div className="mb-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
                Symptoms submitted
              </p>
              <p className="text-sm text-slate-300">{result.symptoms}</p>
            </div>

            {/* Recommendation text */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
                {result.recommendation}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-5 text-xs text-slate-500 border-t border-slate-800 pt-4">
              ⚠️ This is an AI-generated suggestion for informational purposes
              only. Always consult a licensed medical professional for diagnosis
              and treatment.
            </p>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="mt-16 text-center text-xs text-slate-600">
          <p>
            Curis Telehealth Platform &mdash; Built with Next.js, Express &amp;
            Prisma
          </p>
          <p className="mt-1">
            Backend API:{" "}
            <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
              {API_URL}/api/recommendations
            </code>
          </p>
        </footer>
      </div>
    </div>
  );
}
