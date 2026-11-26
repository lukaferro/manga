import type { Metadata } from "next";
import { Suspense } from "react";
import MyListView, { ListSkeleton } from "@/components/my-list/MyListView";
import styles from "../browse/browse.module.css";

export const metadata: Metadata = {
  title: "My List | Manga & Anime",
  robots: { index: false, follow: false },
};

export default function MyListPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<ListSkeleton />}>
        <MyListView />
      </Suspense>
    </main>
  );
}
