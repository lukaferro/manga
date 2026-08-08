export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark";

export const THEMES: Theme[] = ["light", "dark"];

export const THEME_CHANGE_EVENT = "themechange";

export function readThemeCookie(): Theme {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : "";
  if (value === "light" || value === "dark") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function setThemeAttribute(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
