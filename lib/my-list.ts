import { listItemTitle, maxProgress } from "./list-store";
import type { ListItem, MediaListStatus } from "./types";

export type ListTab = "ALL" | "CURRENT" | "PLANNING" | "COMPLETED" | "PAUSED" | "DROPPED";
export type ListSort = "UPDATED" | "TITLE" | "SCORE" | "PROGRESS" | "AIRING";

export const LIST_TABS: ListTab[] = [
  "ALL",
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "PAUSED",
  "DROPPED",
];

export const LIST_SORTS: { value: ListSort; label: string }[] = [
  { value: "UPDATED", label: "Recently Updated" },
  { value: "AIRING", label: "Next Episode" },
  { value: "TITLE", label: "Title" },
  { value: "SCORE", label: "Score" },
  { value: "PROGRESS", label: "Progress" },
];

/** Rewatching/rereading entries are shown together with current ones. */
export function tabForStatus(status: MediaListStatus): Exclude<ListTab, "ALL"> {
  return status === "REPEATING" ? "CURRENT" : status;
}

export function countByTab(items: ListItem[]): Record<ListTab, number> {
  const counts: Record<ListTab, number> = {
    ALL: items.length,
    CURRENT: 0,
    PLANNING: 0,
    COMPLETED: 0,
    PAUSED: 0,
    DROPPED: 0,
  };
  for (const item of items) counts[tabForStatus(item.status)]++;
  return counts;
}

export function filterItems(items: ListItem[], tab: ListTab, query: string): ListItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (tab !== "ALL" && tabForStatus(item.status) !== tab) return false;
    if (!q) return true;
    const { romaji, english, native } = item.media.title;
    return [romaji, english, native].some((t) => t?.toLowerCase().includes(q));
  });
}

function progressRatio(item: ListItem): number {
  const max = maxProgress(item.media);
  return max ? (item.progress ?? 0) / max : 0;
}

export function sortItems(items: ListItem[], sort: ListSort): ListItem[] {
  const sorted = [...items];
  switch (sort) {
    case "TITLE":
      return sorted.sort((a, b) => listItemTitle(a.media).localeCompare(listItemTitle(b.media)));
    case "SCORE":
      return sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    case "PROGRESS":
      return sorted.sort((a, b) => progressRatio(b) - progressRatio(a));
    case "AIRING":
      return sorted.sort(
        (a, b) =>
          (a.media.nextAiringEpisode?.airingAt ?? Infinity) -
          (b.media.nextAiringEpisode?.airingAt ?? Infinity),
      );
    case "UPDATED":
    default:
      return sorted.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }
}

/** Episodes already aired that the user hasn't watched yet (anime only). */
export function episodesBehind(item: ListItem): number {
  if (item.media.type !== "ANIME") return 0;
  if (item.status !== "CURRENT" && item.status !== "REPEATING") return 0;
  const aired = item.media.nextAiringEpisode
    ? item.media.nextAiringEpisode.episode - 1
    : item.media.status === "FINISHED"
      ? (item.media.episodes ?? 0)
      : 0;
  return Math.max(0, aired - (item.progress ?? 0));
}
