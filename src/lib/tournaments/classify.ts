const PLAY_SESSION = [
  "pasizaidimas",
  "pasizaidimai",
  "pasizaisk",
  "meet and play",
  "meet&play",
  "social tennis",
  "open play",
  "tennis session",
  "organised play",
  "organized play",
  "mix session",
  "doubles session",
  "tennis evening",
  "tennis meetup",
  "/games",
  "/meet-and-play",
  "/pasizaidimai",
];

export type OpportunityClass = {
  eventType: "TOURNAMENT" | "PLAY_SESSION";
  audience: "OPEN_AMATEURS" | "CLUB_MEMBERS" | "INVITATION_ONLY" | "COMPANY" | null;
  durationType: "ONGOING" | "LEAGUE" | null;
};

export function classifyOpportunity(input: { title?: string; text?: string; url?: string }): OpportunityClass {
  const haystack = normalize(`${input.title ?? ""} ${input.text ?? ""} ${input.url ?? ""}`);
  const eventType = PLAY_SESSION.some((term) => haystack.includes(normalize(term))) ? "PLAY_SESSION" : "TOURNAMENT";

  let audience: OpportunityClass["audience"] = "OPEN_AMATEURS";
  if (/(tik nariams|club members only|members only|nariams only)/.test(haystack)) audience = "CLUB_MEMBERS";
  else if (/(invitation only|tik kviest|kvietimu)/.test(haystack)) audience = "INVITATION_ONLY";
  else if (/(darbuotojams|employees only|company tournament|imones turnyr)/.test(haystack)) audience = "COMPANY";

  let durationType: OpportunityClass["durationType"] = null;
  if (/(issukis|isukis|league|ladder|challenge)/.test(haystack)) durationType = "LEAGUE";
  else if (/(ziema|pavasaris|vasara|ruduo)\s*'?\d{2}/.test(haystack)) durationType = "ONGOING";

  return { eventType, audience, durationType };
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase();
}
