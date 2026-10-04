"use client";

import { useState, useEffect } from "react";
import styles from "./AiringCountdown.module.css";

interface AiringCountdownProps {
  airingAt: number; // Unix timestamp in seconds
  episode: number;
}

export default function AiringCountdown({
  airingAt,
  episode,
}: AiringCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, airingAt - Math.floor(Date.now() / 1000));
  });

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, airingAt - Math.floor(Date.now() / 1000));
      setTimeLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [airingAt]);

  if (timeLeft <= 0) {
    return (
      <div className={styles.airingNowBanner}>
        <span className={styles.liveDot} />
        <span>Episode {episode} is airing or has aired!</span>
      </div>
    );
  }

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.floor(timeLeft % 60);

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
            {String(days).padStart(2, "0")}
          </span>
          <span className={styles.label}>Days</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {String(hours).padStart(2, "0")}
          </span>
          <span className={styles.label}>Hours</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {String(minutes).padStart(2, "0")}
          </span>
          <span className={styles.label}>Mins</span>
        </div>

        <span className={styles.separator}>:</span>

        <div className={styles.unit}>
          <span className={styles.number}>
            {String(seconds).padStart(2, "0")}
          </span>
          <span className={styles.label}>Secs</span>
        </div>
      </div>
    </div>
  );
}
