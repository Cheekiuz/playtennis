export function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="32" cy="32" rx="22" ry="14" />
      <circle cx="32" cy="32" r="7" fill="currentColor" fillOpacity="0.3" />
      <circle cx="32" cy="32" r="4" />
    </svg>
  );
}

export default function EyeWatchingIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 80"
      fill="none"
      className="mx-auto h-24 w-36 text-accent/80"
      aria-hidden="true"
    >
      <ellipse cx="50" cy="40" rx="28" ry="18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="40" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="40" r="3" fill="currentColor" />
      <circle cx="88" cy="52" r="10" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M88 52c0-3 2-5 4-5s4 2 4 5"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <path d="M62 44 Q75 48 78 52" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
    </svg>
  );
}
