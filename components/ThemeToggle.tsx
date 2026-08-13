"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  readThemeCookie,
  saveTheme,
  setThemeAttribute,
  THEME_CHANGE_EVENT,
  type Theme,
} from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  labels: { light: string; dark: string };
}

function themeSubscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export default function ThemeToggle({ labels }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    themeSubscribe,
    readThemeCookie,
    () => "light" as Theme,
  );

  useLayoutEffect(() => {
    setThemeAttribute(theme);
  }, [theme]);

  function handleToggle() {
    saveTheme(theme === "dark" ? "light" : "dark");
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={isDark ? labels.light : labels.dark}
      title={isDark ? labels.light : labels.dark}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path
            d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
