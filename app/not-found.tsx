import Link from "next/link";
import styles from "./browse/browse.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon} aria-hidden="true">
          🔍
        </p>
        <h1 className={styles.emptyTitle}>Page not found</h1>
        <p className={styles.emptySubtitle}>
          This title, character or page doesn&apos;t exist — it may have been removed from AniList.
        </p>
        <Link href="/browse" className={styles.button} style={{ marginTop: "1.25rem" }}>
          Browse anime &amp; manga
        </Link>
      </div>
    </main>
  );
}
