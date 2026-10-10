import type { Metadata } from "next";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import InfiniteGrid from "@/components/browse/InfiniteGrid";
import { AniListError, fetchGenres, fetchMediaList } from "@/lib/anilist";
import {
  filtersToQuery,
  parseBrowseParams,
  toMediaListParams,
  type BrowseFilters,
} from "@/lib/browse-filters";
import styles from "./browse.module.css";
import { LoadingGrid } from "./loading";

export const metadata: Metadata = {
  title: "Browse | Manga & Anime",
};

type RawParams = Record<string, string | string[] | undefined>;

async function MediaGrid({ filters, page }: { filters: BrowseFilters; page: number }) {
  let result;
  try {
    result = (await fetchMediaList(toMediaListParams(filters, page))).Page;
  } catch (err) {
    console.error("Browse fetch failed:", err instanceof AniListError ? err.message : err);
    return (
      <div className={styles.errorState}>
        <p>Something went wrong while fetching the data.</p>
        <p className={styles.emptySubtitle}>Please try adjusting your filters or refresh the page.</p>
      </div>
    );
  }

  if (result.media.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No results found</p>
        <p className={styles.emptySubtitle}>Try a different search or fewer filters.</p>
      </div>
    );
  }

  return (
    <InfiniteGrid
      initialMedia={result.media}
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

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Browse</h1>
      <FilterBar initialGenres={genres} />

      <Suspense key={`${query}|${page}`} fallback={<LoadingGrid />}>
        <MediaGrid filters={filters} page={page} />
      </Suspense>
    </main>
  );
}
