"use client";

import { useState } from "react";
import TennisBallIcon from "@/components/TennisBallIcon";
import { useLocale } from "@/context/LocaleContext";

interface WaitlistFormProps {
  onSuccess?: () => void;
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const { messages: m } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const mapError = (status: number, apiError?: string) => {
    if (status === 400) return m.waitlist.errors.invalidEmail;
    if (status === 409) return m.waitlist.errors.alreadyRegistered;
    if (apiError?.toLowerCase().includes("unavailable")) return m.waitlist.errors.unavailable;
    return m.waitlist.errors.generic;
  };

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

      setError(mapError(res.status, data.error));
    } catch {
      setError(m.waitlist.errors.network);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-glow success-pop w-full max-w-lg rounded-2xl border border-accent/30 bg-card p-8 text-center backdrop-blur-md">
        <div className="flex justify-center">
          <TennisBallIcon size={48} className="animate-bounce" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">{m.waitlist.successTitle}</h2>
        <p className="mt-2 text-sm text-muted">
          {alreadyRegistered ? m.waitlist.successExisting : m.waitlist.successNew}{" "}
          <span className="text-accent">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <form
      className="card-glow w-full max-w-lg rounded-2xl border border-border bg-card p-8 backdrop-blur-md"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold text-foreground">{m.waitlist.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{m.waitlist.subtitle}</p>

      <div className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={m.waitlist.placeholder}
          disabled={loading}
          className="w-full rounded-xl border border-border bg-input-bg px-4 py-3.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30 disabled:opacity-60"
          required
        />
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-glow btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          <TennisBallIcon size={24} variant="cta" />
          {loading ? m.waitlist.loading : m.waitlist.button}
          {!loading && <span>→</span>}
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] font-medium tracking-widest text-muted uppercase">
        {m.waitlist.disclaimer}
      </p>
    </form>
  );
}
