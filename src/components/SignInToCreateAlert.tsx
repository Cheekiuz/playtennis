"use client";

import { useLocale } from "@/context/LocaleContext";
import { localePath } from "@/lib/i18n";

export default function SignInToCreateAlert() {
  const { messages: m, locale } = useLocale();
  const gate = m.courtAlerts.signInGate;
  const returnPath = `${localePath(locale, "/court-alerts")}#create-alert`;
  const loginUrl = `/auth/login?next=${encodeURIComponent(returnPath)}`;

  return (
    <div
      id="create-alert"
      className="glass-card card-glow w-full max-w-2xl rounded-3xl border border-border bg-card/95 p-8 text-center backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold text-foreground">{gate.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{gate.subtitle}</p>
      <a
        href={loginUrl}
        className="btn-glow btn-primary mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
      >
        {gate.cta}
      </a>
    </div>
  );
}
