export const SAVED_TOURNAMENTS_KEY = "playtennis.saved.v1";

export function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_TOURNAMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeSavedIds(ids: string[]) {
  window.localStorage.setItem(SAVED_TOURNAMENTS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("playtennis-saved"));
}

export function toggleSavedId(id: string): boolean {
  const ids = readSavedIds();
  const exists = ids.includes(id);
  writeSavedIds(exists ? ids.filter((item) => item !== id) : [id, ...ids]);
  return !exists;
}
