export type CourtSurface = "clay" | "hard" | "grass";

export const COURT_SURFACE_EVENT = "playtennis-court-surface";

interface CourtActions {
  triggerBurst: () => void;
  triggerRain: () => void;
  cycleSurface: () => void;
  setSurface?: (surface: CourtSurface) => void;
}

type MotionActions = Pick<CourtActions, "triggerBurst" | "triggerRain">;
type SurfaceActions = Pick<CourtActions, "cycleSurface" | "setSurface">;

let motionActions: MotionActions | null = null;
let surfaceActions: SurfaceActions | null = null;
let requestedSurface: CourtSurface | null = null;

export function registerCourtMotion(actions: MotionActions | null) {
  motionActions = actions;
}

export function registerCourtSurface(actions: SurfaceActions | null) {
  surfaceActions = actions;
}

export function registerCourtActions(actions: CourtActions | null) {
  motionActions = actions;
  surfaceActions = actions;
}

export function releaseCourtMotion(actions: MotionActions) {
  if (motionActions === actions) motionActions = null;
}

export function releaseCourtSurface(actions: SurfaceActions) {
  if (surfaceActions === actions) surfaceActions = null;
}

export function peekRequestedSurface(): CourtSurface | null {
  return requestedSurface;
}

export function emitCourtSurface(surface: CourtSurface) {
  requestedSurface = surface;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CourtSurface>(COURT_SURFACE_EVENT, { detail: surface }));
}

export function triggerCourtBurst(): boolean {
  if (!motionActions) return false;
  motionActions.triggerBurst();
  return true;
}

export function triggerCourtRain(): boolean {
  if (!motionActions) return false;
  motionActions.triggerRain();
  return true;
}

export function cycleCourtSurface(): boolean {
  if (!surfaceActions) return false;
  surfaceActions.cycleSurface();
  return true;
}

export function setCourtSurface(surface: CourtSurface): boolean {
  requestedSurface = surface;
  if (!surfaceActions?.setSurface) return false;
  surfaceActions.setSurface(surface);
  return true;
}
