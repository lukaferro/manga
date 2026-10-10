import type { Metadata } from "next";
import ScheduleView from "@/components/schedule/ScheduleView";
import { AniListError, fetchAiringSchedule, type AiringScheduleItem } from "@/lib/anilist";
import styles from "../browse/browse.module.css";

export const metadata: Metadata = {
  title: "Airing Schedule | Manga & Anime",
  description: "Anime episodes airing today and this week, in your local time.",
};

export const revalidate = 1800;

const HOUR = 3600;
const DAY = 24 * HOUR;

async function loadSchedule(): Promise<{
  items: AiringScheduleItem[];
  errorMessage: string | null;
}> {
  // Round to the hour so the cached AniList request is reused, and pad by a
  // day on each side so every visitor's local "today" is fully covered.
  const now = Math.floor(Date.now() / 1000);
  const from = Math.floor(now / HOUR) * HOUR - DAY;
  const to = from + 9 * DAY;

  try {
    return { items: await fetchAiringSchedule(from, to), errorMessage: null };
  } catch (err) {
    return {
      items: [],
      errorMessage: err instanceof AniListError ? err.message : "Error loading schedule.",
    };
  }
}

export default async function SchedulePage() {
  const { items, errorMessage } = await loadSchedule();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Airing Schedule</h1>
      {errorMessage ? (
        <p className={styles.errorState}>
          Couldn&apos;t load the schedule right now. Please try again later.
        </p>
      ) : (
        <ScheduleView items={items} />
      )}
    </main>
  );
}
