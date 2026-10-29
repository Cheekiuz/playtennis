"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { localePath } from "@/lib/i18n";

type ModalKind = "story" | "sources" | null;

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
      {kind === "sources" ? <SourcesModal onClose={close} /> : null}
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

function SourcesModal({ onClose }: { onClose: () => void }) {
  const { messages } = useLocale();
  const m = messages.sourcesModal;

  return (
    <ModalShell title={`${messages.meta.siteName} · ${m.eyebrow}`} heading={m.title} onClose={onClose}>
      <p className="text-sm leading-6 text-[#434845]">{m.intro}</p>
      <div className="mt-6 space-y-5">
        <SourceBlock
          title={m.directoriesTitle}
          body={m.directoriesBody}
          tag={m.directoriesTag}
          links={[
            { href: "https://tenisonamai.lt/", label: "TenisoNamai" },
            { href: "https://www.topspin.lt/", label: "Topspin" },
          ]}
        />
        <SourceBlock title={m.facebookTitle} body={m.facebookBody} tag={m.facebookTag} tagTone="warn" />
        <SourceBlock
          title={m.itfTitle}
          body={m.itfBody}
          tag={m.itfTag}
          links={[
            {
              href: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/",
              label: "ITF",
            },
          ]}
        />
        <SourceBlock title={m.missingTitle} body={m.missingBody} />
        <SourceBlock title={m.privateTitle} body={m.privateBody} />
      </div>
    </ModalShell>
  );
}

function SourceBlock({
  title,
  body,
  tag,
  tagTone = "neutral",
  links,
}: {
  title: string;
  body: string;
  tag?: string;
  tagTone?: "neutral" | "warn";
  links?: { href: string; label: string }[];
}) {
  return (
    <div className="rounded-2xl border border-[#e7e7e2] bg-[#fbfbfa] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#111915]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#434845]">{body}</p>
          {tag ? (
            <span
              className={
                tagTone === "warn"
                  ? "mt-3 inline-flex rounded-full bg-[#ffdbcf] px-2.5 py-1 text-[11px] font-bold text-[#822801]"
                  : "mt-3 inline-flex rounded-full bg-[#eeeeed] px-2.5 py-1 text-[11px] font-bold text-[#434845]"
              }
            >
              {tag}
            </span>
          ) : null}
        </div>
        {links?.length ? (
          <div className="flex flex-col items-end gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[#111915] hover:underline"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
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
