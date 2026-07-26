interface IllustrationProps {
  className?: string;
}

export function ChooseIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 60" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="15" width="60" height="35" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="28" x2="70" y2="28" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="25" cy="22" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="22" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="55" cy="22" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 38h40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 44h25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}

export function MonitorIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 60" fill="none" className={className} aria-hidden="true">
      <circle cx="40" cy="28" r="18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M40 10v4M40 42v4M22 28h-4M62 28h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M28 48 Q40 54 52 48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

export function NotifyIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M40 12c-8 0-14 6-14 14v8l-4 6h36l-4-6v-8c0-8-6-14-14-14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M34 46a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="52" cy="18" r="6" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M52 15v3M52 21v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
