import type { Metadata } from "next";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import MediaCard from "@/components/MediaCard";
import {
  AniListError,
  fetchHomeSections,
  getCurrentSeason,
  type HomeSections,
} from "@/lib/anilist";
import type { Media } from "@/lib/types";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Home | Manga & Anime",
};

interface SectionProps {
  title: string;
  media: Media[];
  href: string;
}

function browseHref(params: Record<string, string>): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) url.set(key, value);
  }
  return `/browse?${url.toString()}`;
}

function Row({ title, media, href }: SectionProps) {
  return (
    <section className={styles.rowSection}>
      <Link href={href} className={styles.headingLink}>
        <h2 className={styles.heading}>{title}</h2>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          aria-hidden="true"
          className={styles.headingArrow}
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className={styles.row}>
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

  const season = getCurrentSeason();
  const year = new Date().getFullYear();

  const featured = [
    sections.anime.trending[0],
    sections.manga.trending[0],
    sections.anime.trending[1],
    sections.manga.trending[1],
    sections.anime.trending[2],
  ].filter(Boolean) as Media[];

  return (
    <main className="flex flex-1 flex-col">
      <HeroCarousel items={featured} />
      <Row
        title="Anime · Trending"
        media={sections.anime.trending}
        href={browseHref({ type: "ANIME", sort: "TRENDING_DESC" })}
      />
      <Row
        title="Anime · Popular This Season"
        media={sections.anime.season}
        href={browseHref({
          type: "ANIME",
          sort: "POPULARITY_DESC",
          season,
          seasonYear: String(year),
        })}
      />
      <Row
        title="Anime · Top Rated"
        media={sections.anime.top}
        href={browseHref({ type: "ANIME", sort: "SCORE_DESC" })}
      />
      <Row
        title="Manga · Trending"
        media={sections.manga.trending}
        href={browseHref({ type: "MANGA", sort: "TRENDING_DESC" })}
      />
      <Row
        title="Manga · Popular"
        media={sections.manga.popular}
        href={browseHref({ type: "MANGA", sort: "POPULARITY_DESC" })}
      />
      <Row
        title="Manga · Top Rated"
        media={sections.manga.top}
        href={browseHref({ type: "MANGA", sort: "SCORE_DESC" })}
      />
    </main>
  );
}
