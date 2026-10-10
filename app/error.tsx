"use client";

import { useEffect } from "react";
import styles from "./browse/browse.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.emptyState} role="alert">
        <p className={styles.emptyIcon} aria-hidden="true">
          ⚠️
        </p>
        <h1 className={styles.emptyTitle}>Something went wrong</h1>
        <p className={styles.emptySubtitle}>
          We couldn&apos;t load this page. AniList may be busy or temporarily unavailable.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className={styles.button}
          style={{ marginTop: "1.25rem" }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
