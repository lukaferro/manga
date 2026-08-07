import Link from "next/link";
import {
  fetchGenres,
  fetchMediaList,
  AniListError,
} from "@/lib/anilist";
import { getMessages } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type {
  MediaFormat,
  MediaSeason,
  MediaSort,
  MediaStatus,
  MediaType,
} from "@/lib/types";
import MediaCard from "@/components/MediaCard";

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
  const [lang, raw] = await Promise.all([getLang(), searchParams]);
  const t = getMessages(lang);

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
      err instanceof AniListError ? err.message : "Errore durante il caricamento.";
  }

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 1970; y--) {
    years.push(y);
  }

  const selectCls = "border border-black/10 px-2 py-1 text-sm";

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <form
        method="GET"
        action="/browse"
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          {t.searchPlaceholder}
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder={t.searchPlaceholder}
            className={`${selectCls} w-64`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.type}
          <select name="type" defaultValue={type ?? ""} className={selectCls}>
            {TYPES.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? t.all : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.genre}
          <select name="genre" defaultValue={genre ?? ""} className={selectCls}>
            <option value="">{t.all}</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.season}
          <select name="season" defaultValue={season ?? ""} className={selectCls}>
            {SEASONS.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? t.all : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.year}
          <select name="year" defaultValue={year ? String(year) : ""} className={selectCls}>
            <option value="">{t.all}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.format}
          <select name="format" defaultValue={format ?? ""} className={selectCls}>
            {FORMATS.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? t.all : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.status}
          <select name="status" defaultValue={status ?? ""} className={selectCls}>
            {STATUSES.map((v) => (
              <option key={v || "all"} value={v}>
                {v === "" ? t.all : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.sort}
          <select name="sort" defaultValue={sort ?? "POPULARITY_DESC"} className={selectCls}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="border border-black/10 px-3 py-1 text-sm">
          {t.browse}
        </button>
      </form>

      {errorMessage ? (
        <p>{errorMessage}</p>
      ) : result && result.media.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {result.media.map((m) => (
              <MediaCard key={m.id} media={m} />
            ))}
          </div>

          <nav className="mt-6 flex items-center gap-4">
            {page > 1 ? (
              <Link
                className="border border-black/10 px-3 py-1 text-sm"
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
                {t.prev}
              </Link>
            ) : null}
            <span className="text-sm">
              {t.page} {page}
            </span>
            {result.pageInfo.hasNextPage ? (
              <Link
                className="border border-black/10 px-3 py-1 text-sm"
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
                {t.next}
              </Link>
            ) : null}
          </nav>
        </>
      ) : (
        <p>{t.noResults}</p>
      )}
    </main>
  );
}
