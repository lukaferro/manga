import type { MediaListStatus, MediaType } from "./types";

export interface StatusConfig {
  labelAnime: string;
  labelManga: string;
  icon: string;
  color: string;
  bg: string;
}

export const STATUS_CONFIG: Record<MediaListStatus, StatusConfig> = {
  CURRENT: {
    labelAnime: "Watching",
    labelManga: "Reading",
    icon: "▶",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
  },
  REPEATING: {
    labelAnime: "Rewatching",
    labelManga: "Rereading",
    icon: "↻",
    color: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.15)",
  },
  PLANNING: {
    labelAnime: "Plan to Watch",
    labelManga: "Plan to Read",
    icon: "🔖",
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.15)",
  },
  COMPLETED: {
    labelAnime: "Completed",
    labelManga: "Completed",
    icon: "✓",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.15)",
  },
  PAUSED: {
    labelAnime: "Paused",
    labelManga: "Paused",
    icon: "⏸",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
  },
  DROPPED: {
    labelAnime: "Dropped",
    labelManga: "Dropped",
    icon: "✕",
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.15)",
  },
};

/** Statuses offered in the editor (REPEATING is kept but not offered as a pill). */
export const EDITABLE_STATUSES: MediaListStatus[] = [
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "PAUSED",
  "DROPPED",
];

export function statusLabel(status: MediaListStatus, type: MediaType): string {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return status;
  return type === "ANIME" ? cfg.labelAnime : cfg.labelManga;
}

export function progressUnit(type: MediaType): { short: string; long: string } {
  return type === "ANIME"
    ? { short: "Ep", long: "Episodes" }
    : { short: "Ch", long: "Chapters" };
}
