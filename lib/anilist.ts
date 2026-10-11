import { cache } from "react";
import type {
  Character,
  GenresResponse,
  MediaDetailResponse,
  MediaListParams,
  MediaListResponse,
  MediaSeason,
  MediaSort,
  MediaType,
  Staff,
} from "./types";

const ANILIST_URL = "https://graphql.anilist.co";
const MAX_RATE_LIMIT_RETRIES = 4;

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
  { revalidate = 3600 }: { revalidate?: number } = {},
): Promise<T> {
  const request = () =>
    fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

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
    score: params.score ? parseFloat(params.score) : undefined,
  };

  return anilistFetch<MediaListResponse>(MEDIA_LIST_QUERY, variables);
}

// Wrapped in React cache(): POST fetches aren't deduplicated automatically,
// and both generateMetadata and the page request the same media.
export const fetchMediaDetail = cache(
  async (id: number): Promise<MediaDetailResponse> =>
    anilistFetch<MediaDetailResponse>(MEDIA_DETAIL_QUERY, { id }),
);

export async function fetchGenres(): Promise<GenresResponse> {
  return anilistFetch<GenresResponse>(GENRES_QUERY);
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

async function fetchHomeList(
  type: MediaType,
  sort: MediaSort,
  season?: MediaSeason,
  seasonYear?: number,
) {
  const res = await fetchMediaList({
    type,
    sort,
    perPage: HOME_PER_PAGE,
    season,
    seasonYear,
  });
  return res.Page.media;
}

export async function fetchHomeSections(): Promise<HomeSections> {
  const year = new Date().getFullYear();
  const currentSeason = getCurrentSeason();

  const [animeTrending, animeSeason, animeTop, mangaTrending, mangaPopular, mangaTop] =
    await Promise.all([
      fetchHomeList("ANIME", "TRENDING_DESC"),
      fetchHomeList("ANIME", "POPULARITY_DESC", currentSeason, year),
      fetchHomeList("ANIME", "SCORE_DESC"),
      fetchHomeList("MANGA", "TRENDING_DESC"),
      fetchHomeList("MANGA", "POPULARITY_DESC"),
      fetchHomeList("MANGA", "SCORE_DESC"),
    ]);

  return {
    anime: {
      trending: animeTrending,
      season: animeSeason,
      top: animeTop,
    },
    manga: {
      trending: mangaTrending,
      popular: mangaPopular,
      top: mangaTop,
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
  const data = await anilistFetch<{
    media: { media: QuickSearchMedia[] };
    characters: { characters: QuickSearchPerson[] };
    staff: { staff: QuickSearchPerson[] };
  }>(QUICK_SEARCH_QUERY, { search });
  return {
    media: data.media.media,
    characters: data.characters.characters,
    staff: data.staff.staff,
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
    }>(AIRING_SCHEDULE_QUERY, { page, from, to }, { revalidate: 1800 });
    items.push(...data.Page.airingSchedules);
    if (!data.Page.pageInfo.hasNextPage) break;
  }
  return items.filter((item) => item.media && !item.media.isAdult);
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

export const fetchCharacter = cache(
  async (id: number): Promise<Character | null> =>
    (await anilistFetch<{ Character: Character | null }>(CHARACTER_QUERY, { id })).Character,
);

export const fetchStaff = cache(
  async (id: number): Promise<Staff | null> =>
    (await anilistFetch<{ Staff: Staff | null }>(STAFF_QUERY, { id })).Staff,
);

/**
 * Point AniList links inside description HTML to this app's own pages,
 * e.g. https://anilist.co/character/123/Fern → /character/123.
 */
export function localizeAniListLinks(html: string): string {
  return html.replace(
    /href=(["'])https?:\/\/anilist\.co\/(anime|manga|character|staff)\/(\d+)[^"']*\1/g,
    (_match, quote: string, kind: string, id: string) => {
      const path = kind === "anime" || kind === "manga" ? "media" : kind;
      return `href=${quote}/${path}/${id}${quote}`;
    },
  );
}
