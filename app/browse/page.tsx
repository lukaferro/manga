import Link from "next/link";
import { Suspense } from "react";
import MediaCard from "@/components/MediaCard";
import FilterBar from "@/components/FilterBar";
import {
  fetchGenres,
  fetchMediaList,
  AniListError,
} from "@/lib/anilist";
import type {
  MediaFormat,
  MediaSeason,
  MediaSort,
  MediaStatus,
  MediaType,
} from "@/lib/types";
import styles from "./browse.module.css";
import { LoadingGrid } from "./loading";

const PER_PAGE = 24;

const TYPES: (MediaType | "")[] = ["", "ANIME", "MANGA"];
const SEASONS: (MediaSeason | "")[] = ["", "WINTER", "SPRING", "SUMMER", "FALL"];
const FORMATS: (MediaFormat | "")[] = [
  "",
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
  "MANGA",
  "NOVEL",
  "ONE_SHOT",
];
const STATUSES: (MediaStatus | "")[] = [
  "",
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];
const SORTS: MediaSort[] = [
  "POPULARITY_DESC",
  "TRENDING_DESC",
  "SCORE_DESC",
  "START_DATE_DESC",
  "TITLE_ROMAJI",
];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | undefined): string | undefined {
  return value && value !== "" ? value : undefined;
}

function asEnumValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}

interface BuildHrefArgs {
  page: number;
  search?: string;
  type?: string;
  genre?: string;
  sort?: string;
  season?: string;
  year?: string;
  format?: string;
  status?: string;
}

function buildHref(args: BuildHrefArgs): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (key === "page") continue;
    if (value && value !== "") url.set(key, value);
  }
  url.set("page", String(args.page));
  return `/browse?${url.toString()}`;
}

async function MediaGrid({
  params,
}: {
  params: {
    page: number;
    search?: string;
    type?: MediaType;
    genre?: string;
    sort?: MediaSort;
    season?: MediaSeason;
    year?: number;
    format?: MediaFormat;
    status?: MediaStatus;
  };
}) {
  let result;
  let errorMessage: string | null = null;

  try {
    const mediaData = await fetchMediaList({
      page: params.page,
      perPage: PER_PAGE,
      search: params.search,
      type: params.type,
      genre: params.genre,
      season: params.season,
      seasonYear: params.year,
      format: params.format,
      status: params.status,
      sort: params.sort,
    });
    result = mediaData.Page;
  } catch (err) {
    errorMessage =
      err instanceof AniListError ? err.message : "Error loading content.";
  }

  if (errorMessage) {
    return (
      <div className={styles.errorState}>
        <p>Something went wrong while fetching the data.</p>
        <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Please try adjusting your filters or refresh the page.
        </p>
      </div>
    );
  }

  if (!result || result.media.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔍</div>
        <p className={styles.emptyTitle}>No anime or manga found</p>
        <p className={styles.emptySubtitle}>
          Try loosening your filters or searching for a different title.
        </p>
      </div>
    );
  }

  const currentPage = result.pageInfo.currentPage ?? 1;

  return (
    <>
      <div className={styles.grid}>
        {result.media.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </div>

      <nav className={styles.pagination}>
        {currentPage > 1 ? (
          <Link
            className={styles.button}
            href={buildHref({
              page: currentPage - 1,
              search: params.search,
              type: params.type,
              genre: params.genre,
              sort: params.sort,
              season: params.season,
              year: params.year ? String(params.year) : undefined,
              format: params.format,
              status: params.status,
            })}
          >
            Previous
          </Link>
        ) : null}
        <span className={styles.pageInfo}>
          Page {currentPage}
        </span>
        {result.pageInfo.hasNextPage ? (
          <Link
            className={styles.button}
            href={buildHref({
              page: currentPage + 1,
              search: params.search,
              type: params.type,
              genre: params.genre,
              sort: params.sort,
              season: params.season,
              year: params.year ? String(params.year) : undefined,
              format: params.format,
              status: params.status,
            })}
          >
            Next
          </Link>
        ) : null}
      </nav>
    </>
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;

  const page = Math.max(1, parseInt(first(raw.page) ?? "1", 10) || 1);
  const search = cleanParam(first(raw.search));
  const type = asEnumValue(cleanParam(first(raw.type)), TYPES as readonly MediaType[]);
  const genre = cleanParam(first(raw.genre));
  const sort = asEnumValue(cleanParam(first(raw.sort)), SORTS as readonly MediaSort[]);
  const season = asEnumValue(cleanParam(first(raw.season)), SEASONS as readonly MediaSeason[]);
  const yearValue = cleanParam(first(raw.year));
  const year = yearValue ? Number.parseInt(yearValue, 10) : undefined;
  const format = asEnumValue(cleanParam(first(raw.format)), FORMATS as readonly MediaFormat[]);
  const status = asEnumValue(cleanParam(first(raw.status)), STATUSES as readonly MediaStatus[]);

  const genreData = await fetchGenres();
  const genres = genreData.GenreCollection;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Browse</h1>
      <FilterBar initialGenres={genres} />
      
      <Suspense 
        key={`${search}-${type}-${genre}-${sort}-${season}-${year}-${format}-${status}-${page}`} 
        fallback={<LoadingGrid />}
      >
        <MediaGrid 
          params={{
            page,
            search,
            type,
            genre,
            sort,
            season,
            year: Number.isNaN(year) ? undefined : year,
            format,
            status,
          }} 
        />
      </Suspense>
    </main>
  );
}
