import { tabForStatus, type ListTab } from "./my-list";
import type { ListItem } from "./types";

export interface CountRow {
  key: string;
  count: number;
}

export interface GenreRow extends CountRow {
  /** Mean of the user's scores for titles in this genre (0-100), if any are scored */
  meanScore: number | null;
}

export interface ListStats {
  total: number;
  /** Episodes (anime) or chapters (manga) completed */
  unitsDone: number;
  /** Anime only: progress × episode duration */
  minutesWatched: number;
  meanScore: number | null;
  scoredCount: number;
  byStatus: Record<Exclude<ListTab, "ALL">, number>;
  /** 10 buckets: index 0 = scores 1-10, … index 9 = 91-100 */
  scoreBuckets: number[];
  genres: GenreRow[];
  formats: CountRow[];
  /** Started titles grouped by release decade, e.g. "2010s" */
  decades: CountRow[];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sortedRows(map: Map<string, number>): CountRow[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function computeStats(items: ListItem[]): ListStats {
  const byStatus = { CURRENT: 0, PLANNING: 0, COMPLETED: 0, PAUSED: 0, DROPPED: 0 };
  const scoreBuckets = Array<number>(10).fill(0);
  const genreCounts = new Map<string, number>();
  const genreScores = new Map<string, number[]>();
  const formats = new Map<string, number>();
  const decades = new Map<string, number>();
  const scores: number[] = [];
  let unitsDone = 0;
  let minutesWatched = 0;

  for (const item of items) {
    byStatus[tabForStatus(item.status)]++;

    const progress = item.progress ?? 0;
    unitsDone += progress;
    if (item.media.type === "ANIME" && item.media.duration) {
      minutesWatched += progress * item.media.duration;
    }

    if (item.score && item.score > 0) {
      scores.push(item.score);
      scoreBuckets[Math.min(9, Math.ceil(item.score / 10) - 1)]++;
    }

    // Planned titles describe intent, not taste: keep them out of the breakdowns
    if (item.status === "PLANNING") continue;

    for (const genre of item.media.genres ?? []) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      if (item.score && item.score > 0) {
        const list = genreScores.get(genre) ?? [];
        list.push(item.score);
        genreScores.set(genre, list);
      }
    }

    if (item.media.format) {
      const label = item.media.format.replace(/_/g, " ");
      formats.set(label, (formats.get(label) ?? 0) + 1);
    }

    if (item.media.seasonYear) {
      const decade = `${Math.floor(item.media.seasonYear / 10) * 10}s`;
      decades.set(decade, (decades.get(decade) ?? 0) + 1);
    }
  }

  return {
    total: items.length,
    unitsDone,
    minutesWatched,
    meanScore: mean(scores),
    scoredCount: scores.length,
    byStatus,
    scoreBuckets,
    genres: sortedRows(genreCounts).map((row) => ({
      ...row,
      meanScore: mean(genreScores.get(row.key) ?? []),
    })),
    formats: sortedRows(formats),
    decades: sortedRows(decades).sort((a, b) => a.key.localeCompare(b.key)),
  };
}

/** "3d 4h" style duration from minutes */
export function formatWatchTime(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${Math.round(minutes % 60)}m`;
  return `${Math.round(minutes)}m`;
}
