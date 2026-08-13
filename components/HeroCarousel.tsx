"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mediaTitle } from "@/components/MediaCard";
import type { Media } from "@/lib/types";
import styles from "./HeroCarousel.module.css";

interface HeroCarouselProps {
  items: Media[];
}

const AUTOPLAY_MS = 6000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, items.length]);

  function goTo(next: number) {
    setIndex(((next % items.length) + items.length) % items.length);
  }

  if (items.length === 0) return null;

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {items.map((media, i) => {
        const active = i === index;
        const bg =
          media.bannerImage ??
          media.coverImage.extraLarge ??
          media.coverImage.large ??
          "";
        const description = media.description ? stripHtml(media.description) : "";
        const genres = media.genres.slice(0, 3);

        return (
          <article
            key={media.id}
            className={`${styles.slide} ${active ? styles.active : ""}`}
            aria-hidden={!active}
          >
            {bg ? (
              <Image
                src={bg}
                alt=""
                fill
                priority={active && i === 0}
                sizes="100vw"
                className={styles.bg}
              />
            ) : null}
            <div className={styles.overlay} />
            <div className={styles.content}>
              <h1 className={styles.title}>{mediaTitle(media)}</h1>
              <div className={styles.meta}>
                {media.averageScore != null ? (
                  <span className={styles.score}>{media.averageScore}</span>
                ) : null}
                {genres.map((g) => (
                  <span key={g} className={styles.genre}>
                    {g}
                  </span>
                ))}
              </div>
              {description ? (
                <p className={styles.desc}>{description}</p>
              ) : null}
              <Link href={`/media/${media.id}`} className={styles.button}>
                Dettagli
              </Link>
            </div>
          </article>
        );
      })}

      {items.length > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => goTo(index - 1)}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => goTo(index + 1)}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className={styles.dots}>
            {items.map((media, i) => (
              <button
                key={media.id}
                type="button"
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
