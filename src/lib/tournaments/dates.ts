export type DateRange = { from: string; to: string };

function vilniusToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function todayIso(): string {
  return vilniusToday();
}

export function rangeForPreset(preset: string | undefined, from?: string, to?: string): DateRange | null {
  const today = parseIso(vilniusToday());

  if (preset === "today") {
    const iso = formatIso(today);
    return { from: iso, to: iso };
  }

  if (preset === "this-week") {
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = addDays(today, -mondayOffset);
    return { from: formatIso(monday), to: formatIso(addDays(monday, 6)) };
  }

  if (preset === "this-weekend" || preset === "next-weekend") {
    const day = today.getDay();
    const daysUntilSaturday = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
    const saturday = addDays(today, daysUntilSaturday + (preset === "next-weekend" ? 7 : 0));
    return { from: formatIso(saturday), to: formatIso(addDays(saturday, 1)) };
  }

  if (preset === "this-month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: formatIso(start), to: formatIso(end) };
  }

  if (preset === "next-month") {
    const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    return { from: formatIso(start), to: formatIso(end) };
  }

  if ((preset === "custom" || !preset) && from && to) {
    return from <= to ? { from, to } : { from: to, to: from };
  }

  return null;
}
