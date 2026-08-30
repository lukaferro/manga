import styles from "./browse.module.css";

export function LoadingGrid() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Browse</h1>
      <div className={styles.skeletonFilterBar} />
      <LoadingGrid />
    </main>
  );
}
