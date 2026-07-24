import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var theme=t==="light"||t==="dark"?t:"${DEFAULT_THEME}";var r=document.documentElement;r.setAttribute("data-theme",theme);r.classList.remove("light","dark");r.classList.add(theme);r.style.colorScheme=theme;}catch(e){var r=document.documentElement;r.setAttribute("data-theme","${DEFAULT_THEME}");r.classList.add("${DEFAULT_THEME}");r.style.colorScheme="${DEFAULT_THEME}";}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
