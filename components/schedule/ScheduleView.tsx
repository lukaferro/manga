"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { STATUS_CONFIG, statusLabel } from "@/lib/list-status";
import { groupByLocalDay } from "@/lib/schedule";
import { formatShortCountdown, useNow } from "@/lib/time";
import { useListCollection } from "@/lib/use-list";
import type { AiringScheduleItem } from "@/lib/anilist";
import type { MediaListStatus } from "@/lib/types";
import styles from "./Schedule.module.css";

const DAYS_SHOWN = 7;
// UI copy is English; en-GB keeps English names with a 24-hour clock
const LOCALE = "en-GB";

function dayLabel(start: number, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Date(start).toLocaleDateString(LOCALE, { weekday: "long" });
}

function itemTitle(item: AiringScheduleItem): string {
  const t = item.media.title;
  return t.romaji || t.english || t.native || "Untitled";
}

export default function ScheduleView({ items }: { items: AiringScheduleItem[] }) {
  const now = useNow(30_000);
  const [dayIndex, setDayIndex] = useState(0);
  const [onlyMine, setOnlyMine] = useState(false);
  const [showAired, setShowAired] = useState(false);
  const { store, items: listItems } = useListCollection("ANIME");

  const listStatus = useMemo(() => {
    const map = new Map<number, MediaListStatus>();
    for (const i of listItems) map.set(i.mediaId, i.status);
    return map;
  }, [listItems]);

  const filtered = useMemo(
    () => (onlyMine ? items.filter((i) => listStatus.has(i.media.id)) : items),
    [items, onlyMine, listStatus],
  );

  // Grouping depends on the visitor's timezone, so it only runs on the client
  const buckets = useMemo(
    () => (now == null ? null : groupByLocalDay(filtered, now * 1000, DAYS_SHOWN)),
    [filtered, now],
  );

  if (!buckets || now == null) {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  const day = buckets[dayIndex];
  const airedCount = day.items.filter((i) => i.airingAt <= now).length;
  // On today, collapse what already aired unless the user asks for it
  const hideAired = dayIndex === 0 && !showAired && airedCount < day.items.length;
  const visible = hideAired ? day.items.filter((i) => i.airingAt > now) : day.items;
  const firstUpcoming = visible.findIndex((i) => i.airingAt > now);

  return (
    <div className={styles.wrapper}>
      <div className={styles.dayTabs} role="tablist" aria-label="Day">
        {buckets.map((bucket, i) => {
          const date = new Date(bucket.start);
          return (
            <button
              key={bucket.start}
              type="button"
              role="tab"
              aria-selected={i === dayIndex}
              className={`${styles.dayTab} ${i === dayIndex ? styles.dayTabActive : ""}`}
              onClick={() => setDayIndex(i)}
            >
              <span className={styles.dayName}>{dayLabel(bucket.start, i)}</span>
              <span className={styles.dayDate}>
                {date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })}
              </span>
              <span className={styles.dayCount}>{bucket.items.length} eps</span>
            </button>
          );
        })}
      </div>

      <div className={styles.toolbar}>
        <p className={styles.tzNote}>
          Times shown in your timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        </p>
        {store && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            <span className={styles.toggleTrack} aria-hidden="true" />
            Only my list
          </label>
        )}
      </div>

      {dayIndex === 0 && airedCount > 0 && airedCount < day.items.length && (
        <button
          type="button"
          className={styles.airedToggle}
          onClick={() => setShowAired((v) => !v)}
          aria-expanded={showAired}
        >
          {showAired ? "Hide" : "Show"} {airedCount} already aired today
        </button>
      )}

      {visible.length === 0 ? (
        <p className={styles.empty}>
          {onlyMine
            ? "Nothing from your list airs on this day."
            : "No episodes scheduled for this day."}
        </p>
      ) : (
        <ol className={styles.timeline}>
          {visible.map((item, i) => {
            const status = listStatus.get(item.media.id);
            const aired = item.airingAt <= now;
            const cover = item.media.coverImage.large ?? item.media.coverImage.medium;
            return (
              <Fragment key={item.id}>
                {dayIndex === 0 && i === firstUpcoming && i > 0 && (
                  <li className={styles.nowMarker} aria-label="Now">
                    <span>Now</span>
                  </li>
                )}
                <li className={`${styles.row} ${aired ? styles.rowAired : ""}`}>
                  <time className={styles.time} dateTime={new Date(item.airingAt * 1000).toISOString()}>
                    {new Date(item.airingAt * 1000).toLocaleTimeString(LOCALE, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <Link
                    href={`/media/${item.media.id}`}
                    className={`${styles.card} ${status ? styles.cardInList : ""}`}
                    style={
                      status
                        ? ({ "--status-color": STATUS_CONFIG[status].color } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span
                      className={styles.cover}
                      style={{ backgroundColor: item.media.coverImage.color ?? undefined }}
                    >
                      {cover ? (
                        <Image src={cover} alt="" fill sizes="56px" className={styles.coverImg} />
                      ) : null}
                    </span>
                    <span className={styles.info}>
                      <span className={styles.title}>{itemTitle(item)}</span>
                      <span className={styles.meta}>
                        Episode {item.episode}
                        {item.media.episodes ? ` of ${item.media.episodes}` : ""}
                        {item.media.format ? ` · ${item.media.format.replace(/_/g, " ")}` : ""}
                        {item.episode === item.media.episodes ? " · Finale" : ""}
                      </span>
                      {status && (
                        <span className={styles.listBadge}>
                          {STATUS_CONFIG[status].icon} {statusLabel(status, "ANIME")}
                        </span>
                      )}
                    </span>
                    <span className={styles.when}>
                      {aired ? "Aired" : `in ${formatShortCountdown(item.airingAt - now)}`}
                    </span>
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </div>
  );
}
