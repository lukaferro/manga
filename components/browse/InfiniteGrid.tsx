"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MediaCard from "@/components/MediaCard";
import type { MediaCardData } from "@/lib/types";
import styles from "@/app/browse/browse.module.css";

interface InfiniteGridProps {
  initialMedia: MediaCardData[];
  initialPage: number;
  initialHasNextPage: boolean;
  /** Filter query string without page, e.g. "type=ANIME&genre=Drama" */
  query: string;
}

/**
 * Server renders the first page; further pages are fetched from /api/browse
 * when the sentinel scrolls into view (or the button is pressed). The button
 * is a real link to ?page=N+1 so it still works without JavaScript.
 */
export default function InfiniteGrid({
  initialMedia,
  initialPage,
  initialHasNextPage,
  query,
}: InfiniteGridProps) {
  const [media, setMedia] = useState(initialMedia);
  const [page, setPage] = useState(initialPage);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasNextPage) return;
    inFlight.current = true;
    setLoading(true);
    setError(false);
    try {
      const next = page + 1;
      const res = await fetch(`/api/browse?${query}${query ? "&" : ""}page=${next}`);
      if (!res.ok) throw new Error();
      const data: { media: MediaCardData[]; hasNextPage: boolean } = await res.json();
      setMedia((prev) => {
        // AniList pagination can shift between requests; never render duplicates
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...data.media.filter((m) => !seen.has(m.id))];
      });
      setPage(next);
      setHasNextPage(data.hasNextPage);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [hasNextPage, page, query]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasNextPage, error]);

  const nextHref = `/browse?${query}${query ? "&" : ""}page=${page + 1}`;

  return (
    <>
      <div className={styles.grid}>
        {media.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </div>

      <div ref={sentinelRef} className={styles.pagination} aria-live="polite">
        {error ? (
          <>
            <span className={styles.pageInfo}>Couldn&apos;t load more results.</span>
            <button type="button" className={styles.button} onClick={loadMore}>
              Try again
            </button>
          </>
        ) : hasNextPage ? (
          <a
            href={nextHref}
            className={styles.button}
            aria-disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              loadMore();
            }}
          >
            {loading ? "Loading…" : "Load more"}
          </a>
        ) : media.length > 0 ? (
          <span className={styles.pageInfo}>You&apos;ve reached the end</span>
        ) : null}
      </div>
    </>
  );
}
