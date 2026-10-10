import Image from "next/image";
import type { ReactNode } from "react";
import BackButton from "@/components/BackButton";
import ExpandableHtml from "@/components/ExpandableHtml";
import { localizeAniListLinks } from "@/lib/anilist";
import type { FuzzyDate } from "@/lib/types";
import detail from "@/app/media/[id]/detail.module.css";
import styles from "./People.module.css";

export interface Fact {
  label: string;
  value: ReactNode;
}

interface PersonLayoutProps {
  name: string;
  nativeName?: string | null;
  alternativeNames?: string[] | null;
  image: string | null;
  /** HTML from AniList (spoilers rendered as .markdown_spoiler) */
  description: string | null;
  facts: Fact[];
  siteUrl: string | null;
  favourites: number | null;
  children: ReactNode;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatFuzzyDate(date: FuzzyDate | null | undefined): string | null {
  if (!date || (!date.year && !date.month)) return null;
  return [date.day, date.month ? MONTHS[date.month - 1] : null, date.year]
    .filter(Boolean)
    .join(" ");
}

export default function PersonLayout({
  name,
  nativeName,
  alternativeNames,
  image,
  description,
  facts,
  siteUrl,
  favourites,
  children,
}: PersonLayoutProps) {
  return (
    <main className={`${detail.page} ${styles.page}`}>
      <div className={detail.container}>
        <div className={styles.back}>
          <BackButton label="Back" fallbackHref="/browse" />
        </div>
        <div className={`${detail.layout} ${styles.layout}`}>
          <aside className={detail.sidebar}>
            <div className={detail.coverWrap}>
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 768px) 260px, 280px"
                  className={detail.coverImage}
                />
              ) : null}
              {favourites ? (
                <div className={detail.scoreBadge}>
                  <span aria-hidden="true">♥</span>
                  <span>{favourites.toLocaleString("en")}</span>
                  <span className="sr-only">favourites</span>
                </div>
              ) : null}
            </div>

            {facts.length > 0 && (
              <div className={detail.metaCard}>
                <span className={detail.metaTitle}>Information</span>
                {facts.map((fact) => (
                  <div key={fact.label} className={detail.metaRow}>
                    <span className={detail.metaLabel}>{fact.label}</span>
                    <span className={detail.metaValue}>{fact.value}</span>
                  </div>
                ))}
              </div>
            )}

            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.anilistLink}
              >
                View on AniList ↗
              </a>
            )}
          </aside>

          <div className={detail.mainCol}>
            <div className={detail.headerInfo}>
              <h1 className={detail.title}>{name}</h1>
              <div className={detail.subtitles}>
                {nativeName ? <span className={detail.nativeTitle}>{nativeName}</span> : null}
                {alternativeNames?.length ? (
                  <span className={detail.englishTitle}>
                    Also known as {alternativeNames.filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </div>
            </div>

            {description && (
              <section className={detail.synopsisSection}>
                <h2 className={detail.sectionTitle}>About</h2>
                <ExpandableHtml
                  html={localizeAniListLinks(description)}
                  className={`${detail.description} ${styles.description}`}
                />
              </section>
            )}

            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
