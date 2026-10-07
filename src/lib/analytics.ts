type EventParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;

  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) cleaned[key] = value;
  }
  gtag("event", event, cleaned);
}
