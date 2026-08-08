export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

export function readThemeCookie(): Theme {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : "";
  return THEMES.includes(value as Theme) ? (value as Theme) : "system";
}

export function applyTheme(theme: Theme) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
