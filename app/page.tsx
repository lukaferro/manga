import type { Metadata } from "next";
import MediaCard from "@/components/MediaCard";
import { AniListError, fetchHomeSections, type HomeSections } from "@/lib/anilist";
import type { Media } from "@/lib/types";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Home | Manga & Anime",
};

interface SectionProps {
  title: string;
  media: Media[];
}

function Section({ title, media }: SectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.grid}>
        {media.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  let sections: HomeSections | null = null;
  let errorMessage: string | null = null;

  try {
    sections = await fetchHomeSections();
  } catch (err) {
    errorMessage =
      err instanceof AniListError ? err.message : "Error loading content.";
  }

  if (errorMessage || !sections) {
    return <main className="px-4 py-6">{errorMessage}</main>;
  }

  return (
    <main className="flex flex-1 flex-col">
      <Section title="Anime · Trending" media={sections.anime.trending} />
      <Section title="Anime · Popular This Season" media={sections.anime.season} />
      <Section title="Anime · Top Rated" media={sections.anime.top} />
      <Section title="Manga · Trending" media={sections.manga.trending} />
      <Section title="Manga · Popular" media={sections.manga.popular} />
      <Section title="Manga · Top Rated" media={sections.manga.top} />
    </main>
  );
}
