import type { Metadata } from "next";
import { Suspense } from "react";
import StatsView from "@/components/stats/StatsView";
import styles from "../../browse/browse.module.css";

export const metadata: Metadata = {
  title: "Stats | Manga & Anime",
};

export default function StatsPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <StatsView />
      </Suspense>
    </main>
  );
}
