import type {
  MediaFormat,
  MediaListParams,
  MediaSeason,
  MediaSort,
  MediaStatus,
  MediaType,
} from "./types";

export const MEDIA_TYPES: MediaType[] = ["ANIME", "MANGA"];
export const SEASONS: MediaSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
export const ANIME_FORMATS: MediaFormat[] = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
export const MANGA_FORMATS: MediaFormat[] = ["MANGA", "NOVEL", "ONE_SHOT"];
export const ALL_FORMATS: MediaFormat[] = [...ANIME_FORMATS, ...MANGA_FORMATS];
export const STATUSES: MediaStatus[] = [
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];
export const SORTS: MediaSort[] = [
  "POPULARITY_DESC",
  "TRENDING_DESC",
  "SCORE_DESC",
  "START_DATE_DESC",
  "TITLE_ROMAJI",
];
export const DEFAULT_SORT: MediaSort = "POPULARITY_DESC";
export const BROWSE_PER_PAGE = 24;

export const LABELS = {
  type: { ANIME: "Anime", MANGA: "Manga" } as Record<string, string>,
  season: { WINTER: "Winter", SPRING: "Spring", SUMMER: "Summer", FALL: "Fall" } as Record<
    string,
    string
  >,
  format: {
    TV: "TV",
    TV_SHORT: "TV Short",
    MOVIE: "Movie",
    SPECIAL: "Special",
    OVA: "OVA",
    ONA: "ONA",
    MUSIC: "Music",
    MANGA: "Manga",
    NOVEL: "Novel",
    ONE_SHOT: "One Shot",
  } as Record<string, string>,
  status: {
    RELEASING: "Releasing",
    FINISHED: "Finished",
    NOT_YET_RELEASED: "Not Yet Released",
    CANCELLED: "Cancelled",
    HIATUS: "Hiatus",
  } as Record<string, string>,
  sort: {
    POPULARITY_DESC: "Popularity",
    TRENDING_DESC: "Trending",
    SCORE_DESC: "Top Score",
    START_DATE_DESC: "Newest",
    TITLE_ROMAJI: "Title (A-Z)",
  } as Record<string, string>,
};

export function formatsForType(type: MediaType | undefined): MediaFormat[] {
  if (type === "ANIME") return ANIME_FORMATS;
  if (type === "MANGA") return MANGA_FORMATS;
  return ALL_FORMATS;
}

export interface BrowseFilters {
  search?: string;
  type?: MediaType;
  genre?: string;
  sort?: MediaSort;
  season?: MediaSeason;
  year?: number;
  format?: MediaFormat;
  status?: MediaStatus;
}

type RawValue = string | string[] | null | undefined;

function first(value: RawValue): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : undefined;
}

function asEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Validate untrusted query params (from the URL or an API request). */
export function parseBrowseParams(get: (key: string) => RawValue): {
  filters: BrowseFilters;
  page: number;
} {
  const year = Number.parseInt(first(get("year")) ?? "", 10);
  const page = Number.parseInt(first(get("page")) ?? "1", 10);
  const search = first(get("search"))?.trim().slice(0, 100);
  const genre = first(get("genre"))?.slice(0, 50);

  return {
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
    filters: {
      search: search || undefined,
      type: asEnum(first(get("type")), MEDIA_TYPES),
      genre: genre || undefined,
      sort: asEnum(first(get("sort")), SORTS),
      season: asEnum(first(get("season")), SEASONS),
      year: Number.isFinite(year) && year > 1900 && year < 2100 ? year : undefined,
      format: asEnum(first(get("format")), ALL_FORMATS),
      status: asEnum(first(get("status")), STATUSES),
    },
  };
}

export function toMediaListParams(filters: BrowseFilters, page: number): MediaListParams {
  return {
    page,
    perPage: BROWSE_PER_PAGE,
    search: filters.search,
    type: filters.type,
    genre: filters.genre,
    season: filters.season,
    seasonYear: filters.year,
    format: filters.format,
    status: filters.status,
    sort: filters.sort,
  };
}

/** Canonical query string for the filters (without page), stable key order. */
export function filtersToQuery(filters: BrowseFilters): string {
  const params = new URLSearchParams();
  const keys: (keyof BrowseFilters)[] = [
    "search",
    "type",
    "genre",
    "sort",
    "season",
    "year",
    "format",
    "status",
  ];
  for (const key of keys) {
    const value = filters[key];
    if (value != null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}
