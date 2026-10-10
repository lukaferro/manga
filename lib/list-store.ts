import type {
  ListItem,
  ListMedia,
  Media,
  MediaListEntry,
  MediaListStatus,
  MediaType,
} from "./types";

export interface SaveEntryInput {
  mediaId: number;
  status: MediaListStatus;
  /** 0-100, 0 or null means "not rated" */
  score?: number | null;
  progress?: number | null;
  /** Media snapshot, required by stores that keep data locally */
  media?: ListMedia;
}

/**
 * Common interface for list persistence, so UI components work the same
 * with an AniList account or with local guest storage.
 */
export interface ListStore {
  kind: "anilist" | "local";
  getEntry(mediaId: number): Promise<MediaListEntry | null>;
  getCollection(type: MediaType): Promise<ListItem[]>;
  save(input: SaveEntryInput): Promise<MediaListEntry>;
  remove(entry: MediaListEntry): Promise<void>;
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const anilistStore: ListStore = {
  kind: "anilist",

  async getEntry(mediaId) {
    const res = await fetch(`/api/media-list?mediaId=${mediaId}`, { cache: "no-store" });
    const data = await readJson<{ entry: MediaListEntry | null }>(res);
    return data.entry;
  },

  async getCollection(type) {
    const res = await fetch(`/api/media-list/collection?type=${type}`, {
      cache: "no-store",
    });
    const data = await readJson<{ items: ListItem[] }>(res);
    return data.items;
  },

  async save({ mediaId, status, score, progress }) {
    const res = await fetch("/api/media-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, status, score: score ?? 0, progress }),
    });
    const data = await readJson<{ entry: MediaListEntry }>(res);
    return data.entry;
  },

  async remove(entry) {
    const res = await fetch("/api/media-list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id }),
    });
    await readJson(res);
  },
};

/* ---------------------------------------------------------------
   Change events: keep every mounted list view in sync after a save
   --------------------------------------------------------------- */

export type ListChange =
  | { kind: "save"; entry: MediaListEntry; media?: ListMedia }
  | { kind: "remove"; mediaId: number };

const CHANGE_EVENT = "medialist:change";

export function emitListChange(change: ListChange) {
  window.dispatchEvent(new CustomEvent<ListChange>(CHANGE_EVENT, { detail: change }));
}

export function onListChange(handler: (change: ListChange) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<ListChange>).detail);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/* --------------------------------------------------------------- */

export function toListMedia(media: Media): ListMedia {
  return {
    id: media.id,
    type: media.type,
    title: media.title,
    coverImage: {
      large: media.coverImage.large,
      medium: media.coverImage.medium,
      color: media.coverImage.color,
    },
    format: media.format,
    status: media.status,
    episodes: media.episodes,
    chapters: media.chapters,
    duration: media.duration,
    genres: media.genres,
    averageScore: media.averageScore,
    seasonYear: media.seasonYear,
    nextAiringEpisode: media.nextAiringEpisode
      ? {
          episode: media.nextAiringEpisode.episode,
          airingAt: media.nextAiringEpisode.airingAt,
        }
      : null,
  };
}

export function maxProgress(media: Pick<ListMedia, "type" | "episodes" | "chapters">) {
  return media.type === "ANIME" ? media.episodes : media.chapters;
}

/**
 * Status after changing progress: reaching the total marks the entry
 * completed, starting a planned entry marks it current.
 */
export function statusForProgress(
  current: MediaListStatus,
  progress: number,
  max: number | null | undefined,
): MediaListStatus {
  if (max && progress >= max) return "COMPLETED";
  if (current === "PLANNING" && progress > 0) return "CURRENT";
  return current;
}

export function listItemTitle(media: Pick<ListMedia, "title">): string {
  return media.title.romaji || media.title.english || media.title.native || "Untitled";
}
