"use client";

import { useNow } from "@/lib/time";
import styles from "./AiringCountdown.module.css";

interface AiringCountdownProps {
  airingAt: number; // Unix timestamp in seconds
  episode: number;
}

export default function AiringCountdown({
  airingAt,
  episode,
}: AiringCountdownProps) {
  // null until mounted, so server and client render the same placeholder
  const now = useNow(1000);
  const timeLeft = now == null ? null : Math.max(0, airingAt - now);

  if (timeLeft === 0) {
    return (
      <div className={styles.airingNowBanner}>
        <span className={styles.liveDot} />
        <span>Episode {episode} is airing or has aired!</span>
      </div>
    );
  }

  const pad = (n: number) => (timeLeft == null ? "--" : String(n).padStart(2, "0"));
  const t = timeLeft ?? 0;
  const days = Math.floor(t / 86400);
  const hours = Math.floor((t % 86400) / 3600);
  const minutes = Math.floor((t % 3600) / 60);
  const seconds = Math.floor(t % 60);

  return (
    <div className={styles.countdownCard}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.pulseDot} />
          <span className={styles.title}>Episode {episode} Airing Countdown</span>
        </div>
        <span className={styles.tag}>Live Schedule</span>
      </div>

      <div className={styles.timerGrid}>
        <div className={styles.unit}>
          <span className={styles.number}>
            {pad(days)}
          </span>
          <span className={styles.label}>Days</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {pad(hours)}
          </span>
          <span className={styles.label}>Hours</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {pad(minutes)}
          </span>
          <span className={styles.label}>Mins</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {pad(seconds)}
          </span>
          <span className={styles.label}>Secs</span>
        </div>
      </div>
    </div>
  );
}
