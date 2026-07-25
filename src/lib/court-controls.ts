interface CourtActions {
  triggerBurst: () => void;
  triggerRain: () => void;
}

let courtActions: CourtActions | null = null;

export function registerCourtActions(actions: CourtActions | null) {
  courtActions = actions;
}

export function triggerCourtBurst(): boolean {
  if (!courtActions) return false;
  courtActions.triggerBurst();
  return true;
}

export function triggerCourtRain(): boolean {
  if (!courtActions) return false;
  courtActions.triggerRain();
  return true;
}
