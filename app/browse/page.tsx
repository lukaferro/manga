import Link from "next/link";
import MediaCard from "@/components/MediaCard";
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

const TYPE_LABELS: Record<string, string> = {
  ANIME: "Anime",
  MANGA: "Manga",
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

const FORMAT_LABELS: Record<string, string> = {
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
};

const STATUS_LABELS: Record<string, string> = {
  RELEASING: "Releasing",
  FINISHED: "Finished",
  NOT_YET_RELEASED: "Not Yet Released",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
};

const SORT_LABELS: Record<string, string> = {
  POPULARITY_DESC: "Popularity",
  TRENDING_DESC: "Trending",
  SCORE_DESC: "Score",
  START_DATE_DESC: "Start Date",
  TITLE_ROMAJI: "Title",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | undefined): string | undefined {
  return value && value !== "" ? value : undefined;
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

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;

  const page = Math.max(1, parseInt(first(raw.page) ?? "1", 10) || 1);
  const search = cleanParam(first(raw.search));
  const type = cleanParam(first(raw.type)) as MediaType | undefined;
  const genre = cleanParam(first(raw.genre));
  const sort = cleanParam(first(raw.sort)) as MediaSort | undefined;
  const season = cleanParam(first(raw.season)) as MediaSeason | undefined;
  const year = parseInt(cleanParam(first(raw.year)) ?? "", 10);
  const format = cleanParam(first(raw.format)) as MediaFormat | undefined;
  const status = cleanParam(first(raw.status)) as MediaStatus | undefined;

  let genres: string[] = [];
  let result;
  let errorMessage: string | null = null;

  try {
    const [genreData, mediaData] = await Promise.all([
      fetchGenres(),
      fetchMediaList({
        page,
        perPage: PER_PAGE,
        search,
        type,
        genre,
        season,
        seasonYear: Number.isNaN(year) ? undefined : year,
        format,
        status,
        sort,
      }),
    ]);
    genres = genreData.GenreCollection;
    result = mediaData.Page;
  } catch (err) {
    errorMessage =
      err instanceof AniListError ? err.message : "Error loading content.";
  }

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 1970; y--) {
    years.push(y);
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <form method="GET" action="/browse" className={styles.form}>
        <label className={styles.field}>
          Search anime and manga...
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search anime and manga..."
            className={`${styles.control} ${styles.searchInput}`}
          />
        </label>
        <label className={styles.field}>
          Type
          <select name="type" defaultValue={type ?? ""} className={styles.control}>
            {TYPES.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? "All" : TYPE_LABELS[v] ?? v}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Genre
          <select name="genre" defaultValue={genre ?? ""} className={styles.control}>
            <option value="">All</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Season
          <select name="season" defaultValue={season ?? ""} className={styles.control}>
            {SEASONS.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? "All" : SEASON_LABELS[v] ?? v}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Year
          <select name="year" defaultValue={year ? String(year) : ""} className={styles.control}>
            <option value="">All</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Format
          <select name="format" defaultValue={format ?? ""} className={styles.control}>
            {FORMATS.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? "All" : FORMAT_LABELS[v] ?? v}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Status
          <select name="status" defaultValue={status ?? ""} className={styles.control}>
            {STATUSES.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? "All" : STATUS_LABELS[v] ?? v}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Sort
          <select name="sort" defaultValue={sort ?? "POPULARITY_DESC"} className={styles.control}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.button}>
          Browse
        </button>
      </form>

      {errorMessage ? (
        <p>{errorMessage}</p>
      ) : result && result.media.length > 0 ? (
        <>
          <div className={styles.grid}>
            {result.media.map((m) => (
              <MediaCard key={m.id} media={m} />
            ))}
          </div>

          <nav className={styles.pagination}>
            {page > 1 ? (
              <Link
                className={styles.button}
                href={buildHref({
                  page: page - 1,
                  search,
                  type,
                  genre,
                  sort,
                  season,
                  year: year ? String(year) : undefined,
                  format,
                  status,
                })}
              >
                Previous
              </Link>
            ) : null}
            <span className={styles.pageInfo}>
              Page {page}
            </span>
            {result.pageInfo.hasNextPage ? (
              <Link
                className={styles.button}
                href={buildHref({
                  page: page + 1,
                  search,
                  type,
                  genre,
                  sort,
                  season,
                  year: year ? String(year) : undefined,
                  format,
                  status,
                })}
              >
                Next
              </Link>
            ) : null}
          </nav>
        </>
      ) : (
        <p>No results found.</p>
      )}
    </main>
  );
}
