export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

export const THEME_STORAGE_KEY = "playtennis-theme";
export const DEFAULT_THEME: Theme = "dark";

export function isValidTheme(value: string): value is Theme {
  return themes.includes(value as Theme);
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && isValidTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function readThemeFromDom(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const fromDom = document.documentElement.getAttribute("data-theme");
  if (fromDom && isValidTheme(fromDom)) return fromDom;
  if (document.documentElement.classList.contains("light")) return "light";
  return getStoredTheme() ?? DEFAULT_THEME;
}
