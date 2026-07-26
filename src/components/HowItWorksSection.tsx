"use client";

import { useLocale } from "@/context/LocaleContext";
import {
  ChooseIllustration,
  MonitorIllustration,
  NotifyIllustration,
} from "@/components/HowItWorksIllustrations";

export default function HowItWorksSection() {
  const { messages: m } = useLocale();
  const steps = m.courtAlerts.howItWorks.steps;

  const illustrations = [ChooseIllustration, MonitorIllustration, NotifyIllustration];

  return (
    <section className="mt-16 w-full max-w-4xl pb-8">
      <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
        {m.courtAlerts.howItWorks.title}
      </h2>

      <div className="flex flex-col items-center gap-4">
        {steps.map((step, index) => {
          const Illustration = illustrations[index];
          return (
            <div key={step.text} className="flex w-full flex-col items-center gap-4">
              <div className="glass-card card-glow w-full rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/5 text-accent">
                    <Illustration className="h-10 w-10" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-widest text-accent uppercase">
                      {index + 1}
                    </span>
                    <p className="mt-1 text-base leading-relaxed text-foreground/90">{step.text}</p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <span className="text-lg text-muted/50" aria-hidden="true">
                  ↓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
