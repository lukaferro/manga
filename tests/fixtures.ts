import type { ListItem, ListMedia, MediaListStatus } from "@/lib/types";

export function makeMedia(overrides: Partial<ListMedia> = {}): ListMedia {
  return {
    id: 1,
    type: "ANIME",
    title: { romaji: "Sousou no Frieren", english: "Frieren", native: "葬送のフリーレン" },
    coverImage: { large: null, medium: null, color: null },
    format: "TV",
    status: "FINISHED",
    episodes: 28,
    chapters: null,
    duration: 24,
    genres: ["Adventure", "Drama"],
    averageScore: 91,
    seasonYear: 2023,
    nextAiringEpisode: null,
    ...overrides,
  };
}

export function makeItem(
  overrides: Partial<Omit<ListItem, "media">> & { media?: Partial<ListMedia> } = {},
): ListItem {
  const { media, ...entry } = overrides;
  const id = entry.mediaId ?? media?.id ?? 1;
  return {
    id,
    mediaId: id,
    status: "CURRENT" as MediaListStatus,
    score: null,
    progress: 0,
    updatedAt: 0,
    ...entry,
    media: makeMedia({ id, ...media }),
  };
}
