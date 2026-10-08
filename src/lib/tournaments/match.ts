import type { Messages } from "@/lib/i18n";
import { environmentLabel, eventTypeLabel, playLevelLabel, surfaceLabel } from "@/lib/tournaments/present";
import type { TournamentRecord } from "@/lib/tournaments/types";

export type QuizAnswers = {
  travel: string;
  format: string;
  surface: string;
  age: string;
  mood: string;
};

export function matchReasons(event: TournamentRecord, answers: QuizAnswers, messages: Messages): { reasons: string[]; matched: boolean } {
  const reasons: string[] = [];
  const d = messages.discover;
  let matched = false;

  if (answers.surface && answers.surface !== "any" && event.surface === answers.surface) {
    reasons.push(surfaceLabel(event.surface, messages));
    matched = true;
  }

  if (answers.format === "singles" && playsSingles(event)) {
    reasons.push(messages.quiz.singles);
    matched = true;
  }
  if (answers.format === "doubles" && playsDoubles(event)) {
    reasons.push(messages.quiz.doubles);
    matched = true;
  }

  if (answers.age === "40" && matchesAgeFloor(event, 40)) {
    reasons.push(messages.quiz.age40);
    matched = true;
  }
  if (answers.age === "50" && matchesAgeFloor(event, 50)) {
    reasons.push(messages.quiz.age50);
    matched = true;
  }
  if (answers.age === "u18" && event.categories.some((category) => category.ageMax != null && category.ageMax <= 18)) {
    reasons.push(messages.quiz.junior);
    matched = true;
  }
  if (answers.age === "open" && event.categories.some((category) => category.ageMin == null && category.ageMax == null)) {
    reasons.push(messages.quiz.open);
    matched = true;
  }

  if (answers.mood === "serious" && (event.playLevel === "ADVANCED" || event.audience === "masters")) {
    reasons.push(event.playLevel ? playLevelLabel(event.playLevel, messages) : d.audiences.masters);
    matched = true;
  }
  if ((answers.mood === "social" || answers.mood === "holiday") && (event.eventType === "SOCIAL" || event.eventType === "PLAY_SESSION")) {
    reasons.push(eventTypeLabel(event.eventType, messages));
    matched = true;
  }
  if (answers.mood === "holiday" && event.environment === "outdoor") {
    reasons.push(environmentLabel(event.environment, messages));
    matched = true;
  }

  const weekend = landsOnWeekend(event.startsOn) || landsOnWeekend(event.endsOn) || event.durationType === "WEEKEND";
  if (answers.travel === "trip" && weekend) matched = true;

  if (weekend) {
    reasons.push(d.thisWeekend);
  }
  if (event.publicRegistration === "OPEN") reasons.push(d.publicRegistration.OPEN);

  if (!askedSomethingSpecific(answers) && reasons.length > 0) matched = true;

  return { reasons: [...new Set(reasons.filter(Boolean))], matched };
}

function askedSomethingSpecific(answers: QuizAnswers): boolean {
  return (
    (answers.surface !== "" && answers.surface !== "any") ||
    (answers.format !== "" && answers.format !== "either") ||
    (answers.age !== "" && answers.age !== "open") ||
    answers.mood === "serious" ||
    answers.mood === "holiday" ||
    answers.travel === "trip"
  );
}

function landsOnWeekend(iso: string): boolean {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const weekday = new Date(year, (month ?? 1) - 1, day ?? 1).getDay();
  return weekday === 0 || weekday === 5 || weekday === 6;
}

function playsSingles(event: TournamentRecord): boolean {
  return event.eventFormat === "SINGLES" || event.categories.some((category) => category.discipline === "singles");
}

function playsDoubles(event: TournamentRecord): boolean {
  return (
    event.eventFormat === "MEN_DOUBLES" ||
    event.eventFormat === "WOMEN_DOUBLES" ||
    event.eventFormat === "MIXED_DOUBLES" ||
    event.categories.some((category) => category.discipline === "doubles" || category.discipline === "mixed_doubles")
  );
}

function matchesAgeFloor(event: TournamentRecord, years: number): boolean {
  if (event.categories.length === 0) return false;
  return event.categories.some((category) => {
    const minOk = category.ageMin == null || category.ageMin <= years;
    const maxOk = category.ageMax == null || category.ageMax >= years;
    return minOk && maxOk && (category.ageMin != null || category.ageMax != null);
  });
}
