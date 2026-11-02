import type { TournamentRecord } from "@/lib/tournaments/types";

export const SAVED_TOURNAMENTS_KEY = "playtennis.saved.v1";

export type SavedSnapshot = {
  id: string;
  slug: string;
  name: string;
  city: string;
  countryCode: string;
  startsOn: string;
  endsOn: string;
  catalogSection: TournamentRecord["catalogSection"];
};

type SavedStore = {
  ids: string[];
  snapshots: Record<string, SavedSnapshot>;
};

function emptyStore(): SavedStore {
  return { ids: [], snapshots: {} };
}

function asSnapshot(value: unknown): SavedSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.slug !== "string" || typeof row.name !== "string") return null;
  if (typeof row.city !== "string" || typeof row.countryCode !== "string") return null;
  if (typeof row.startsOn !== "string" || typeof row.endsOn !== "string") return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    countryCode: row.countryCode,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    catalogSection:
      row.catalogSection === "lithuania" || row.catalogSection === "baltics" || row.catalogSection === "itf"
        ? row.catalogSection
        : null,
  };
}

function readStore(): SavedStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(SAVED_TOURNAMENTS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as unknown;

    // Legacy format: string[]
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((id): id is string => typeof id === "string");
      return { ids, snapshots: {} };
    }

    if (!parsed || typeof parsed !== "object") return emptyStore();
    const row = parsed as Record<string, unknown>;
    const ids = Array.isArray(row.ids) ? row.ids.filter((id): id is string => typeof id === "string") : [];
    const snapshots: Record<string, SavedSnapshot> = {};
    if (row.snapshots && typeof row.snapshots === "object") {
      for (const [id, value] of Object.entries(row.snapshots as Record<string, unknown>)) {
        const snapshot = asSnapshot(value);
        if (snapshot) snapshots[id] = snapshot;
      }
    }
    return { ids, snapshots };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: SavedStore) {
  const snapshots: Record<string, SavedSnapshot> = {};
  for (const id of store.ids) {
    if (store.snapshots[id]) snapshots[id] = store.snapshots[id];
  }
  window.localStorage.setItem(SAVED_TOURNAMENTS_KEY, JSON.stringify({ ids: store.ids, snapshots }));
  window.dispatchEvent(new Event("playtennis-saved"));
}

export function snapshotFromTournament(tournament: Pick<
  TournamentRecord,
  "id" | "slug" | "name" | "city" | "countryCode" | "startsOn" | "endsOn" | "catalogSection"
>): SavedSnapshot {
  return {
    id: tournament.id,
    slug: tournament.slug,
    name: tournament.name,
    city: tournament.city,
    countryCode: tournament.countryCode,
    startsOn: tournament.startsOn,
    endsOn: tournament.endsOn,
    catalogSection: tournament.catalogSection,
  };
}

export function readSavedIds(): string[] {
  return readStore().ids;
}

export function readSavedSnapshots(): Record<string, SavedSnapshot> {
  return readStore().snapshots;
}

export function writeSavedIds(ids: string[]) {
  const current = readStore();
  writeStore({ ids, snapshots: current.snapshots });
}

export function toggleSavedId(id: string, snapshot?: SavedSnapshot | null): boolean {
  const store = readStore();
  const exists = store.ids.includes(id);
  if (exists) {
    writeStore({
      ids: store.ids.filter((item) => item !== id),
      snapshots: store.snapshots,
    });
    return false;
  }

  const snapshots = { ...store.snapshots };
  if (snapshot && snapshot.id === id) snapshots[id] = snapshot;
  writeStore({ ids: [id, ...store.ids], snapshots });
  return true;
}
