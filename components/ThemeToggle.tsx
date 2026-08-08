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

const THEME_ORDER: Theme[] = ["light", "dark"];

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

  function handleChange(next: Theme) {
    saveTheme(next);
  }

  return (
    <select
      className={styles.select}
      value={theme}
      onChange={(e) => handleChange(e.target.value as Theme)}
      aria-label="Theme"
    >
      {THEME_ORDER.map((t) => (
        <option key={t} value={t}>
          {labels[t]}
        </option>
      ))}
    </select>
  );
}
