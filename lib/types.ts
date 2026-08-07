export type MediaType = "ANIME" | "MANGA";

export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";

export type MediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export type MediaSort =
  | "POPULARITY_DESC"
  | "TRENDING_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC"
  | "TITLE_ROMAJI";

export interface Title {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface CoverImage {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface FuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface Studio {
  id: number;
  name: string;
}

export interface CharacterEdge {
  role: string | null;
  node: {
    id: number;
    name: { full: string | null };
    image: { large: string | null };
  } | null;
}

export interface RelationEdge {
  relationType: string | null;
  node: {
    id: number;
    type: MediaType;
    title: Title;
    coverImage: CoverImage;
    averageScore: number | null;
  } | null;
}

export interface MediaCardData {
  id: number;
  title: Title;
  type: MediaType;
  coverImage: CoverImage;
  averageScore: number | null;
}

export interface Media {
  id: number;
  title: Title;
  type: MediaType;
  format: MediaFormat | null;
  status: MediaStatus | null;
  description: string | null;
  coverImage: CoverImage;
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  genres: string[];
  season: MediaSeason | null;
  seasonYear: number | null;
  startDate: FuzzyDate;
  endDate: FuzzyDate;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  source: string | null;
  countryOfOrigin: string | null;
  isAdult: boolean | null;
  siteUrl: string | null;
  studios: { nodes: Studio[] } | null;
  characters: { edges: CharacterEdge[] } | null;
  relations: { edges: RelationEdge[] } | null;
}

export interface PageInfo {
  currentPage: number | null;
  hasNextPage: boolean;
  perPage: number | null;
}

export interface MediaListResponse {
  Page: {
    pageInfo: PageInfo;
    media: Media[];
  };
}

export interface MediaDetailResponse {
  Media: Media | null;
}

export interface GenresResponse {
  GenreCollection: string[];
}

export interface MediaListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: MediaType;
  genre?: string;
  season?: MediaSeason;
  seasonYear?: number;
  format?: MediaFormat;
  status?: MediaStatus;
  sort?: MediaSort;
}
