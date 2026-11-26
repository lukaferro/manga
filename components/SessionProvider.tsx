"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AniListUser } from "@/lib/auth";

export type SessionStatus = "loading" | "authenticated" | "guest";

interface SessionValue {
  user: AniListUser | null;
  status: SessionStatus;
}

const SessionContext = createContext<SessionValue>({ user: null, status: "loading" });

const LOGGED_IN_COOKIE = "anilist_logged_in";

function hasAuthHintCookie(): boolean {
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${LOGGED_IN_COOKIE}=1`);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SessionValue>({ user: null, status: "loading" });

  useEffect(() => {
    // Skip the /api/auth/me serverless invocation for anonymous guests
    if (!hasAuthHintCookie()) {
      const id = setTimeout(() => setValue({ user: null, status: "guest" }), 0);
      return () => clearTimeout(id);
    }

    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .catch(() => ({ user: null }))
      .then((data: { user: AniListUser | null }) => {
        if (cancelled) return;
        setValue({
          user: data.user,
          status: data.user ? "authenticated" : "guest",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

export function loginHref(returnTo: string): string {
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo || "/")}`;
}
