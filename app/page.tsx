import type { Metadata } from "next";
import MediaCard from "@/components/MediaCard";
import { AniListError, fetchHomeSections, type HomeSections } from "@/lib/anilist";
import { getMessages } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
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
  const lang = await getLang();
  const t = getMessages(lang);

  let sections: HomeSections | null = null;
  let errorMessage: string | null = null;

  try {
    sections = await fetchHomeSections();
  } catch (err) {
    errorMessage =
      err instanceof AniListError ? err.message : "Errore durante il caricamento.";
  }

  if (errorMessage || !sections) {
    return <main className="px-4 py-6">{errorMessage}</main>;
  }

  return (
    <main className="flex flex-1 flex-col">
      <Section title={`${t.anime} · ${t.trending}`} media={sections.anime.trending} />
      <Section
        title={`${t.anime} · ${t.popularThisSeason}`}
        media={sections.anime.season}
      />
      <Section title={`${t.anime} · ${t.topRated}`} media={sections.anime.top} />
      <Section title={`${t.manga} · ${t.trending}`} media={sections.manga.trending} />
      <Section title={`${t.manga} · ${t.popular}`} media={sections.manga.popular} />
      <Section title={`${t.manga} · ${t.topRated}`} media={sections.manga.top} />
    </main>
  );
}
