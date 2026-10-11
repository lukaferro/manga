import type { Metadata } from "next";
import ScheduleView from "@/components/schedule/ScheduleView";
import { fetchAiringSchedule, type AiringScheduleItem } from "@/lib/anilist";
import styles from "../browse/browse.module.css";

export const metadata: Metadata = {
  title: "Airing Schedule | Manga & Anime",
  description: "Anime episodes airing today and this week, in your local time.",
};

export const revalidate = 1800;

const HOUR = 3600;
const DAY = 24 * HOUR;

async function loadSchedule(): Promise<AiringScheduleItem[]> {
  // Round to the hour so the cached AniList request is reused, and pad by a
  // day on each side so every visitor's local "today" is fully covered.
  const now = Math.floor(Date.now() / 1000);
  const from = Math.floor(now / HOUR) * HOUR - DAY;
  const to = from + 9 * DAY;

  // Errors propagate to app/error.tsx so a failed fetch is never cached
  return fetchAiringSchedule(from, to);
}

export default async function SchedulePage() {
  const items = await loadSchedule();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Airing Schedule</h1>
      <ScheduleView items={items} />
    </main>
  );
}
