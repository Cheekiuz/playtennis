"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import type { Messages } from "@/lib/i18n";

type Answers = {
  travel?: string;
  format?: string;
  surface?: string;
  age?: string;
  mood?: string;
};

export default function QuizFlow({ messages, action }: { messages: Messages; action: string }) {
  const router = useRouter();
  const q = messages.quiz;
  const steps = [
    {
      key: "travel" as const,
      prompt: q.travel,
      options: [
        ["city", q.travelCity],
        ["country", q.travelCountry],
        ["trip", q.travelTrip],
        ["anywhere", q.travelAnywhere],
      ],
    },
    {
      key: "format" as const,
      prompt: q.format,
      options: [
        ["singles", q.singles],
        ["doubles", q.doubles],
        ["either", q.either],
      ],
    },
    {
      key: "surface" as const,
      prompt: q.surface,
      options: [
        ["clay", q.clay],
        ["hard", q.hard],
        ["grass", q.grass],
        ["any", q.any],
      ],
    },
    {
      key: "age" as const,
      prompt: q.age,
      options: [
        ["open", q.open],
        ["40", q.age40],
        ["50", q.age50],
        ["u18", q.junior],
      ],
    },
    {
      key: "mood" as const,
      prompt: q.mood,
      options: [
        ["serious", q.serious],
        ["social", q.social],
        ["holiday", q.holiday],
      ],
    },
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    track("quiz_started");
  }, []);
  const current = steps[step];

  return (
    <div className="grid max-w-xl gap-6">
      <p className="text-sm text-foreground/60">
        {step + 1} / {steps.length}
      </p>
      <h2 className="text-2xl font-bold">{current.prompt}</h2>
      <div className="grid gap-2">
        {current.options.map(([value, label]) => {
          const selected = answers[current.key] === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAnswers((prev) => ({ ...prev, [current.key]: value }))}
              className={`border px-4 py-3 text-left text-sm font-semibold ${selected ? "border-accent text-accent" : "border-border hover:bg-surface"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-4">
        {step > 0 ? (
          <button type="button" className="text-sm font-semibold" onClick={() => setStep((value) => value - 1)}>
            {q.back}
          </button>
        ) : null}
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!answers[current.key]}
            className="btn-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40"
            onClick={() => setStep((value) => value + 1)}
          >
            {q.next}
          </button>
        ) : (
          <button
            type="button"
            disabled={!answers.mood}
            className="btn-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40"
            onClick={() => {
              const params = new URLSearchParams({ done: "1" });
              for (const [key, value] of Object.entries(answers)) {
                if (value) params.set(key, value);
              }
              track("quiz_completed", {
                travel: answers.travel,
                format: answers.format,
                surface: answers.surface,
                age: answers.age,
                mood: answers.mood,
              });
              router.push(`${action}?${params.toString()}`);
            }}
          >
            {q.see}
          </button>
        )}
      </div>
    </div>
  );
}
