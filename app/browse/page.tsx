import type { Metadata } from "next";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import InfiniteGrid from "@/components/browse/InfiniteGrid";
import { AniListError, HOME_REVALIDATE, fetchGenres, fetchMediaList } from "@/lib/anilist";
import {
  filtersToQuery,
  parseBrowseParams,
  toMediaListParams,
  type BrowseFilters,
} from "@/lib/browse-filters";
import { isValidEntityId } from "@/lib/entity-id";
import styles from "./browse.module.css";
import { LoadingGrid } from "./loading";

// Always dynamic SSR: never create ISR page entries for arbitrary filter/query combinations
export const dynamic = "force-dynamic";

type RawParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const hasQueryParams = Object.keys(raw).length > 0;
  return {
    title: "Browse | Manga & Anime",
    ...(hasQueryParams ? { robots: { index: false, follow: true } } : {}),
  };
}

async function MediaGrid({
  filters,
  page,
  isDefaultView,
}: {
  filters: BrowseFilters;
  page: number;
  isDefaultView: boolean;
}) {
  let result;
  try {
    // Only cache the single canonical unfiltered /browse page (1 Data Cache key);
    // filtered, searched, or paginated requests bypass Data Cache to prevent ISR write bloat.
    const cacheOptions = isDefaultView
      ? { revalidate: HOME_REVALIDATE }
      : { cache: "no-store" as const };
    result = (await fetchMediaList(toMediaListParams(filters, page), cacheOptions)).Page;
  } catch (err) {
    console.error("Browse fetch failed:", err instanceof AniListError ? err.message : err);
    return (
      <div className={styles.errorState}>
        <p>Something went wrong while fetching the data.</p>
        <p className={styles.emptySubtitle}>Please try adjusting your filters or refresh the page.</p>
      </div>
    );
  }

  const validMedia = result.media.filter((m) => isValidEntityId(m?.id));

  if (validMedia.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No results found</p>
        <p className={styles.emptySubtitle}>Try a different search or fewer filters.</p>
      </div>
    );
  }

  return (
    <InfiniteGrid
      initialMedia={validMedia}
      initialPage={result.pageInfo.currentPage ?? page}
      initialHasNextPage={result.pageInfo.hasNextPage}
      query={filtersToQuery(filters)}
    />
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const { filters, page } = parseBrowseParams((key) => raw[key]);
  const genres = (await fetchGenres()).GenreCollection;
  const query = filtersToQuery(filters);
  const isDefaultView = query === "" && page === 1;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Browse</h1>
      <FilterBar initialGenres={genres} />

      <Suspense key={`${query}|${page}`} fallback={<LoadingGrid />}>
        <MediaGrid filters={filters} page={page} isDefaultView={isDefaultView} />
      </Suspense>
    </main>
  );
}
