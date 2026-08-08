"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  readThemeCookie,
  systemPrefersDark,
  type Theme,
} from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  labels: { light: string; dark: string; system: string };
}

const THEME_ORDER: Theme[] = ["light", "dark", "system"];

const THEME_CHANGE_EVENT = "themechange";

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
    () => "system" as Theme,
  );

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.setAttribute(
        "data-theme",
        systemPrefersDark() ? "dark" : "light",
      );
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  function handleChange(next: Theme) {
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
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
