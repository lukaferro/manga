"use client";

import { useState } from "react";
import styles from "./ScoreStars.module.css";

interface ScoreStarsProps {
  /** Score on AniList's 0-100 scale; 0 means not rated */
  value: number;
  onChange: (value: number) => void;
  labelledBy?: string;
}

const STARS = 10;

const VERDICTS = [
  "Appalling",
  "Horrible",
  "Very bad",
  "Bad",
  "Average",
  "Fine",
  "Good",
  "Very good",
  "Great",
  "Masterpiece",
];

/** Text for a 0-10 rating, e.g. 8.5 -> "Very good" */
export function scoreVerdict(rating: number): string {
  if (rating <= 0) return "Not rated";
  return VERDICTS[Math.min(STARS, Math.ceil(rating)) - 1];
}

function Star({ fill }: { fill: number }) {
  return (
    <span className={styles.star} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={styles.starEmpty}>
        <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z" />
      </svg>
      <span
        className={styles.starFill}
        style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z" />
        </svg>
      </span>
    </span>
  );
}

/**
 * Ten clickable stars with half-star precision (left half of a star = .5).
 * Hover previews the rating; clicking the current rating clears it.
 * Exposed as a slider: arrows step by 0.5, Home/End, Delete clears.
 * Existing 0-100 scores (e.g. 73) are kept exact until changed.
 */
export default function ScoreStars({ value, onChange, labelledBy }: ScoreStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const rating = value / 10;
  const shown = hover ?? rating;

  function ratingFromPointer(e: React.MouseEvent<HTMLDivElement>): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width - 0.01);
    return Math.max(0.5, Math.ceil((x / rect.width) * STARS * 2) / 2);
  }

  function set(next: number) {
    onChange(Math.round(Math.min(STARS, Math.max(0, next)) * 10));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 0.5;
    // Snap to the half-star grid first so 7.3 -> 7.5 / 7.0
    const snapped = Math.round(rating * 2) / 2;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        set(snapped > rating ? snapped : snapped + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        set(snapped < rating ? snapped : snapped - step);
        break;
      case "Home":
        e.preventDefault();
        set(0);
        break;
      case "End":
        e.preventDefault();
        set(STARS);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        set(0);
        break;
    }
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.stars}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelledBy}
        aria-valuemin={0}
        aria-valuemax={STARS}
        aria-valuenow={rating}
        aria-valuetext={rating > 0 ? `${rating} out of 10, ${scoreVerdict(rating)}` : "Not rated"}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => setHover(ratingFromPointer(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          const next = ratingFromPointer(e);
          // Clicking the current rating again removes it
          set(Math.abs(next - rating) < 0.01 ? 0 : next);
        }}
      >
        {Array.from({ length: STARS }, (_, i) => (
          <Star key={i} fill={Math.min(1, Math.max(0, shown - i))} />
        ))}
      </div>

      <div className={styles.readout} aria-hidden="true">
        <span className={styles.value}>
          {shown > 0 ? (
            <>
              <strong>{Number.isInteger(shown) ? shown : shown.toFixed(1)}</strong>
              <span className={styles.outOf}>/ 10</span>
            </>
          ) : (
            <span className={styles.unrated}>Not rated</span>
          )}
        </span>
        {shown > 0 && <span className={styles.verdict}>{scoreVerdict(shown)}</span>}
        {value > 0 && hover == null && (
          <button type="button" className={styles.clear} onClick={() => set(0)}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
