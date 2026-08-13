import type {
  GenresResponse,
  MediaDetailResponse,
  MediaListParams,
  MediaListResponse,
  MediaSeason,
  MediaSort,
  MediaType,
} from "./types";

const ANILIST_URL = "https://graphql.anilist.co";

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
): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json?.errors?.[0]?.message ?? `AniList error ${res.status}`;
    throw new AniListError(message, res.status);
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
      characters(page: 1, perPage: 10) {
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
    }
  }
`;

export const GENRES_QUERY = `
  query {
    GenreCollection
  }
`;

export async function fetchMediaList(
  params: MediaListParams,
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

  return anilistFetch<MediaListResponse>(MEDIA_LIST_QUERY, variables);
}

export async function fetchMediaDetail(id: number): Promise<MediaDetailResponse> {
  return anilistFetch<MediaDetailResponse>(MEDIA_DETAIL_QUERY, { id });
}

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
