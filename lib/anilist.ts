import { cache } from "react";
import { isValidEntityId, parseEntityId } from "./entity-id";
import type {
  Character,
  GenresResponse,
  MediaDetailResponse,
  MediaListParams,
  MediaListResponse,
  MediaSeason,
  MediaType,
  Staff,
} from "./types";

const ANILIST_URL = "https://graphql.anilist.co";
const MAX_RATE_LIMIT_RETRIES = 4;

/** Conservative ISR / Data Cache TTLs (seconds) to stay well within Vercel Free limits */
export const HOME_REVALIDATE = 21_600; // 6 hours
export const SCHEDULE_REVALIDATE = 21_600; // 6 hours
export const MEDIA_REVALIDATE = 604_800; // 7 days
export const STATIC_ENTITY_REVALIDATE = 2_592_000; // 30 days (characters, staff, genres)

export interface FetchCacheOptions {
  revalidate?: number;
  cache?: RequestCache;
}

export class AniListError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AniListError";
    this.status = status;
  }
}

export async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: FetchCacheOptions = {},
): Promise<T> {
  const { cache: cacheMode, revalidate } = options;
  const fetchInit: RequestInit & { next?: { revalidate: number } } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  if (cacheMode === "no-store") {
    fetchInit.cache = "no-store";
  } else {
    fetchInit.next = { revalidate: revalidate ?? HOME_REVALIDATE };
  }

  const request = () => fetch(ANILIST_URL, fetchInit);

  let res = await request();

  // AniList rate limits aggressively; honour Retry-After a couple of times
  for (let attempt = 0; res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 2;
    await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 10) * 1000));
    res = await request();
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.data) {
    const message = json?.errors?.[0]?.message ?? `AniList error ${res.status}`;
    throw new AniListError(message, res.ok ? 500 : res.status);
  }

  return json.data as T;
}

export const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  type
  format
  status
  description(asHtml: true)
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  averageScore
  meanScore
  popularity
  genres
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  episodes
  chapters
  volumes
  duration
  source
  countryOfOrigin
  isAdult
  siteUrl
  trailer {
    id
    site
    thumbnail
  }
  studios {
    nodes {
      id
      name
    }
  }
`;

export const MEDIA_LIST_QUERY = `
  query (
    $page: Int
    $perPage: Int
    $search: String
    $type: MediaType
    $genre: [String]
    $season: MediaSeason
    $seasonYear: Int
    $format: [MediaFormat]
    $status: MediaStatus
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        perPage
      }
      media(
        search: $search
        type: $type
        genre_in: $genre
        season: $season
        seasonYear: $seasonYear
        format_in: $format
        status: $status
        sort: $sort
        isAdult: false
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export const MEDIA_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      ${MEDIA_FIELDS}
      nextAiringEpisode {
        episode
        airingAt
        timeUntilAiring
      }
      externalLinks {
        id
        url
        site
        color
      }
      characters(page: 1, perPage: 8, sort: [ROLE, RELEVANCE]) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id
            name {
              full
            }
            image {
              medium
              large
            }
            language: languageV2
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            type
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              color
            }
            averageScore
          }
        }
      }
      recommendations(page: 1, perPage: 8, sort: [RATING_DESC]) {
        nodes {
          mediaRecommendation {
            id
            type
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              color
            }
            averageScore
          }
        }
      }
    }
  }
`;

export const GENRES_QUERY = `
  query {
    GenreCollection
  }
`;

export async function fetchMediaList(
  params: MediaListParams & { score?: string },
  options: FetchCacheOptions = { cache: "no-store" },
): Promise<MediaListResponse> {
  const variables = {
    page: params.page ?? 1,
    perPage: params.perPage ?? 24,
    search: params.search || undefined,
    type: params.type,
    genre: params.genre ? [params.genre] : undefined,
    season: params.season,
    seasonYear: params.seasonYear,
    format: params.format ? [params.format] : undefined,
    status: params.status,
    sort: params.sort ? [params.sort] : ["POPULARITY_DESC"],
  };

  return anilistFetch<MediaListResponse>(MEDIA_LIST_QUERY, variables, options);
}

// Wrapped in React cache(): POST fetches aren't deduplicated automatically,
// and both generateMetadata and the page request the same media.
export const fetchMediaDetail = cache(async (id: number): Promise<MediaDetailResponse> => {
  const validId = parseEntityId(id);
  if (validId === null) return { Media: null };
  return anilistFetch<MediaDetailResponse>(
    MEDIA_DETAIL_QUERY,
    { id: validId },
    { revalidate: MEDIA_REVALIDATE },
  );
});

export async function fetchGenres(): Promise<GenresResponse> {
  return anilistFetch<GenresResponse>(GENRES_QUERY, {}, { revalidate: STATIC_ENTITY_REVALIDATE });
}

export interface HomeSections {
  anime: {
    trending: MediaListResponse["Page"]["media"];
    season: MediaListResponse["Page"]["media"];
    top: MediaListResponse["Page"]["media"];
  };
  manga: {
    trending: MediaListResponse["Page"]["media"];
    popular: MediaListResponse["Page"]["media"];
    top: MediaListResponse["Page"]["media"];
  };
}

const HOME_PER_PAGE = 12;

const HOME_SECTIONS_QUERY = `
  query ($perPage: Int, $season: MediaSeason, $seasonYear: Int) {
    animeTrending: Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: [TRENDING_DESC], isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
    animeSeason: Page(page: 1, perPage: $perPage) {
      media(
        type: ANIME
        season: $season
        seasonYear: $seasonYear
        sort: [POPULARITY_DESC]
        isAdult: false
      ) {
        ${MEDIA_FIELDS}
      }
    }
    animeTop: Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: [SCORE_DESC], isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
    mangaTrending: Page(page: 1, perPage: $perPage) {
      media(type: MANGA, sort: [TRENDING_DESC], isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
    mangaPopular: Page(page: 1, perPage: $perPage) {
      media(type: MANGA, sort: [POPULARITY_DESC], isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
    mangaTop: Page(page: 1, perPage: $perPage) {
      media(type: MANGA, sort: [SCORE_DESC], isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function fetchHomeSections(): Promise<HomeSections> {
  const year = new Date().getFullYear();
  const currentSeason = getCurrentSeason();

  const data = await anilistFetch<{
    animeTrending: { media: MediaListResponse["Page"]["media"] };
    animeSeason: { media: MediaListResponse["Page"]["media"] };
    animeTop: { media: MediaListResponse["Page"]["media"] };
    mangaTrending: { media: MediaListResponse["Page"]["media"] };
    mangaPopular: { media: MediaListResponse["Page"]["media"] };
    mangaTop: { media: MediaListResponse["Page"]["media"] };
  }>(
    HOME_SECTIONS_QUERY,
    { perPage: HOME_PER_PAGE, season: currentSeason, seasonYear: year },
    { revalidate: HOME_REVALIDATE },
  );

  const valid = (list: MediaListResponse["Page"]["media"] | undefined) =>
    (list ?? []).filter((m) => isValidEntityId(m?.id));

  return {
    anime: {
      trending: valid(data.animeTrending?.media),
      season: valid(data.animeSeason?.media),
      top: valid(data.animeTop?.media),
    },
    manga: {
      trending: valid(data.mangaTrending?.media),
      popular: valid(data.mangaPopular?.media),
      top: valid(data.mangaTop?.media),
    },
  };
}

export function getCurrentSeason(): MediaSeason {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return "WINTER";
  if (month >= 4 && month <= 6) return "SPRING";
  if (month >= 7 && month <= 9) return "SUMMER";
  return "FALL";
}

export interface QuickSearchMedia {
  id: number;
  type: MediaType;
  format: string | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { medium: string | null; color: string | null };
  startDate: { year: number | null };
  averageScore: number | null;
}

export interface QuickSearchPerson {
  id: number;
  name: { full: string | null; native: string | null };
  image: { medium: string | null } | null;
  primaryOccupations?: string[] | null;
}

export interface QuickSearchResults {
  media: QuickSearchMedia[];
  characters: QuickSearchPerson[];
  staff: QuickSearchPerson[];
}

const QUICK_SEARCH_QUERY = `
  query ($search: String) {
    media: Page(perPage: 8) {
      media(search: $search, isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
        id
        type
        format
        title {
          romaji
          english
          native
        }
        coverImage {
          medium
          color
        }
        startDate {
          year
        }
        averageScore
      }
    }
    characters: Page(perPage: 3) {
      characters(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
        id
        name {
          full
          native
        }
        image {
          medium
        }
      }
    }
    staff: Page(perPage: 3) {
      staff(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
        id
        name {
          full
          native
        }
        image {
          medium
        }
        primaryOccupations
      }
    }
  }
`;

export async function fetchQuickSearch(search: string): Promise<QuickSearchResults> {
  // Never write user search terms to Next.js Data Cache; /api/search handles CDN caching
  const data = await anilistFetch<{
    media: { media: QuickSearchMedia[] };
    characters: { characters: QuickSearchPerson[] };
    staff: { staff: QuickSearchPerson[] };
  }>(QUICK_SEARCH_QUERY, { search }, { cache: "no-store" });
  return {
    media: (data.media?.media ?? []).filter((m) => isValidEntityId(m?.id)),
    characters: (data.characters?.characters ?? []).filter((c) => isValidEntityId(c?.id)),
    staff: (data.staff?.staff ?? []).filter((p) => isValidEntityId(p?.id)),
  };
}

export interface AiringScheduleItem {
  id: number;
  episode: number;
  airingAt: number;
  media: {
    id: number;
    type: MediaType;
    format: string | null;
    episodes: number | null;
    isAdult: boolean | null;
    popularity: number | null;
    averageScore: number | null;
    countryOfOrigin: string | null;
    title: { romaji: string | null; english: string | null; native: string | null };
    coverImage: { large: string | null; medium: string | null; color: string | null };
  };
}

const AIRING_SCHEDULE_QUERY = `
  query ($page: Int, $from: Int, $to: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
      }
      airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: [TIME]) {
        id
        episode
        airingAt
        media {
          id
          type
          format
          episodes
          isAdult
          popularity
          averageScore
          countryOfOrigin
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
            color
          }
        }
      }
    }
  }
`;

const MAX_SCHEDULE_PAGES = 6;

/** All episodes airing between two Unix timestamps (seconds). */
export async function fetchAiringSchedule(from: number, to: number): Promise<AiringScheduleItem[]> {
  const items: AiringScheduleItem[] = [];
  for (let page = 1; page <= MAX_SCHEDULE_PAGES; page++) {
    const data = await anilistFetch<{
      Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AiringScheduleItem[] };
    }>(AIRING_SCHEDULE_QUERY, { page, from, to }, { revalidate: SCHEDULE_REVALIDATE });
    items.push(...data.Page.airingSchedules);
    if (!data.Page.pageInfo.hasNextPage) break;
  }
  return items.filter(
    (item) => item.media && isValidEntityId(item.media.id) && !item.media.isAdult,
  );
}

const MEDIA_THUMB_FIELDS = `
  id
  type
  format
  title {
    romaji
    english
    native
  }
  coverImage {
    large
    color
  }
  averageScore
  startDate {
    year
  }
`;

const CHARACTER_QUERY = `
  query ($id: Int) {
    Character(id: $id) {
      id
      name {
        full
        native
        alternative
      }
      image {
        large
      }
      description(asHtml: true)
      gender
      age
      bloodType
      dateOfBirth {
        year
        month
        day
      }
      favourites
      siteUrl
      media(sort: [POPULARITY_DESC], perPage: 24) {
        edges {
          characterRole
          node {
            ${MEDIA_THUMB_FIELDS}
          }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
    }
  }
`;

const STAFF_QUERY = `
  query ($id: Int) {
    Staff(id: $id) {
      id
      name {
        full
        native
        alternative
      }
      image {
        large
      }
      description(asHtml: true)
      primaryOccupations
      gender
      age
      dateOfBirth {
        year
        month
        day
      }
      dateOfDeath {
        year
        month
        day
      }
      yearsActive
      homeTown
      favourites
      siteUrl
      language: languageV2
      characterMedia(sort: [POPULARITY_DESC], perPage: 24) {
        edges {
          characterRole
          node {
            ${MEDIA_THUMB_FIELDS}
          }
          characters {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
      staffMedia(sort: [POPULARITY_DESC], perPage: 18) {
        edges {
          staffRole
          node {
            ${MEDIA_THUMB_FIELDS}
          }
        }
      }
    }
  }
`;

export const fetchCharacter = cache(async (id: number): Promise<Character | null> => {
  const validId = parseEntityId(id);
  if (validId === null) return null;
  return (
    await anilistFetch<{ Character: Character | null }>(
      CHARACTER_QUERY,
      { id: validId },
      { revalidate: STATIC_ENTITY_REVALIDATE },
    )
  ).Character;
});

export const fetchStaff = cache(async (id: number): Promise<Staff | null> => {
  const validId = parseEntityId(id);
  if (validId === null) return null;
  return (
    await anilistFetch<{ Staff: Staff | null }>(
      STAFF_QUERY,
      { id: validId },
      { revalidate: STATIC_ENTITY_REVALIDATE },
    )
  ).Staff;
});

/**
 * Point AniList links inside description HTML to this app's own pages,
 * e.g. https://anilist.co/character/123/Fern → /character/123.
 */
export function localizeAniListLinks(html: string): string {
  return html.replace(
    /href=(["'])https?:\/\/anilist\.co\/(anime|manga|character|staff)\/([1-9]\d*)[^"']*\1/g,
    (_match, quote: string, kind: string, id: string) => {
      const path = kind === "anime" || kind === "manga" ? "media" : kind;
      return `href=${quote}/${path}/${id}${quote}`;
    },
  );
}
