"use client";

import { useState } from "react";

interface WaitlistFormProps {
  onSuccess?: () => void;
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string; alreadyRegistered?: boolean };

      if (res.status === 201) {
        setAlreadyRegistered(false);
        setSubmitted(true);
        onSuccess?.();
        return;
      }

      if (res.status === 409) {
        setAlreadyRegistered(true);
        setSubmitted(true);
        onSuccess?.();
        return;
      }

      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-glow success-pop w-full max-w-lg rounded-2xl border border-accent/30 bg-slate-900/60 p-8 text-center backdrop-blur-md">
        <div className="animate-bounce text-5xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold text-white">You&apos;re officially on the team!</h2>
        <p className="mt-2 text-sm text-muted">
          {alreadyRegistered
            ? "You're already on the waitlist — we'll be in touch at "
            : "We'll serve you launch updates at "}
          <span className="text-accent">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <form
      className="card-glow w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-md"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold text-white">Reserve your court position</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Be among the first players invited to our exclusive beta launch.
      </p>

      <div className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter your email address"
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30 disabled:opacity-60"
          required
        />
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#d4ff33] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          <span>🎾</span>
          {loading ? "Joining..." : "Join the Waitlist"}
          {!loading && <span>→</span>}
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] font-medium tracking-widest text-slate-500 uppercase">
        No spam. Just launch updates and early access.
      </p>
    </form>
  );
}
