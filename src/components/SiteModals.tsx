"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { localePath } from "@/lib/i18n";

type ModalKind = "story" | null;

type SiteModalContextValue = {
  open: (kind: Exclude<ModalKind, null>) => void;
  close: () => void;
};

const SiteModalContext = createContext<SiteModalContextValue | null>(null);

export function useSiteModals() {
  const value = useContext(SiteModalContext);
  if (!value) {
    return {
      open: () => undefined,
      close: () => undefined,
    };
  }
  return value;
}

export function SiteModalProvider({ children }: { children: React.ReactNode }) {
  const [kind, setKind] = useState<ModalKind>(null);
  const open = useCallback((next: Exclude<ModalKind, null>) => setKind(next), []);
  const close = useCallback(() => setKind(null), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  useEffect(() => {
    if (!kind) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [kind, close]);

  return (
    <SiteModalContext.Provider value={value}>
      {children}
      {kind === "story" ? <StoryModal onClose={close} /> : null}
    </SiteModalContext.Provider>
  );
}

function StoryModal({ onClose }: { onClose: () => void }) {
  const { locale, messages } = useLocale();
  const m = messages.story;
  const home = localePath(locale, "/");

  return (
    <ModalShell title={`${messages.meta.siteName} · ${m.eyebrow}`} heading={m.title} onClose={onClose}>
      <h3 className="text-lg font-bold text-[#111915]">{m.builtBy}</h3>
      <p className="mt-3 text-sm leading-6 text-[#434845]">{m.body1}</p>
      <p className="mt-3 text-sm leading-6 text-[#434845]">{m.body2}</p>
      <Link
        href={`${home}#play-next`}
        onClick={onClose}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0d2818] px-5 py-3 text-sm font-bold text-white hover:bg-[#111915]"
      >
        {m.cta} <span aria-hidden="true">↗</span>
      </Link>
    </ModalShell>
  );
}

function ModalShell({
  title,
  heading,
  onClose,
  children,
}: {
  title: string;
  heading: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0d2818]/55 p-3 sm:items-center sm:p-6" role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-modal-heading"
        className="relative z-[61] max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#e7e7e2] bg-[#f9f9f8] shadow-[0_24px_80px_rgba(13,40,24,0.35)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e7e7e2] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#747874]">{title}</p>
            <h2 id="site-modal-heading" className="mt-2 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">
              {heading}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7e7e2] bg-white text-lg font-bold text-[#111915]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="bg-white px-5 py-6 sm:px-7 sm:py-7">{children}</div>
      </div>
    </div>
  );
}
