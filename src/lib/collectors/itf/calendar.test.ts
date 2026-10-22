import { mapItfItem } from "@/lib/collectors/itf/calendar";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const open = mapItfItem({
  tournamentName: "MT400 Pattaya",
  category: "MT400",
  hostNation: "Thailand",
  hostNationCode: "THA",
  venue: "Pattaya",
  startDate: "2026-09-26T00:00:00",
  endDate: "2026-10-01T00:00:00",
  surfaceCode: "H",
  indoorOrOutDoor: "Indoor",
  tournamentKey: "S-MT400-THA-2026-003",
  tournamentLink: "/en/tournament/mt400-pattaya/tha/2026/s-mt400-tha-2026-003/",
});

assert(open != null, "open event maps");
assert(open?.catalogSection === "itf", "section is itf");
assert(open?.countryCode === "th", "THA maps to th");
assert(open?.sourceExternalId === "S-MT400-THA-2026-003", "external id");
assert(open?.indoorOutdoor === "indoor", "indoor");

const closed = mapItfItem({
  tournamentName: "MT400 Tel Aviv - Closed",
  hostNationCode: "ISR",
  startDate: "2026-09-25T00:00:00",
  endDate: "2026-10-03T00:00:00",
  tournamentKey: "S-MT400-ISR-2026-003",
});
assert(closed == null, "closed events skipped");

const cancelled = mapItfItem({
  tournamentName: "MT100 Example",
  hostNationCode: "ESP",
  startDate: "2026-10-01T00:00:00",
  endDate: "2026-10-05T00:00:00",
  tourStatusCode: "CN",
  tourStatusDesc: "CANCELLED",
  tournamentKey: "S-MT100-ESP-2026-001",
});
assert(cancelled == null, "cancelled events skipped");

console.log("itf calendar mapper ok");
