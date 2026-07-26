export {
  getClubLabel,
  getCityLabel,
  getCourtLabel,
  getCourtOptionsForClub,
  getCourtsForClub,
} from "@/lib/court-alerts-config";
export {
  formatDateForDisplay,
  formatTimeForDisplay,
} from "@/lib/court-alerts-validation";

export function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function parseHourFromTime(time: string): number {
  return Number(time.split(":")[0]);
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
