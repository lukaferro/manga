"use client";

import Image from "next/image";
import Link from "next/link";
import { STATUS_CONFIG, progressUnit, statusLabel } from "@/lib/list-status";
import { listItemTitle, maxProgress, statusForProgress } from "@/lib/list-store";
import { episodesBehind } from "@/lib/my-list";
import { formatShortCountdown, useNow } from "@/lib/time";
import type { EntryPatch } from "@/lib/use-list";
import type { ListItem } from "@/lib/types";
import styles from "./MyList.module.css";

interface ListCardProps {
  item: ListItem;
  pending: boolean;
  onUpdate: (patch: EntryPatch) => void;
  onEdit: () => void;
}

export default function ListCard({ item, pending, onUpdate, onEdit }: ListCardProps) {
  const now = useNow();
  const { media } = item;
  const title = listItemTitle(media);
  const max = maxProgress(media);
  const unit = progressUnit(media.type);
  const progress = item.progress ?? 0;
  const percent = max ? Math.min(100, Math.round((progress / max) * 100)) : null;
  const cfg = STATUS_CONFIG[item.status];
  const behind = episodesBehind(item);
  const cover = media.coverImage.large ?? media.coverImage.medium;
  const canIncrement = item.status !== "COMPLETED" && (max == null || progress < max);
  const nextEp = media.nextAiringEpisode;

  function increment() {
    const next = progress + 1;
    onUpdate({
      status: statusForProgress(item.status, next, max),
      progress: next,
      score: item.score,
    });
  }

  return (
    <article
      className={`${styles.card} ${pending ? styles.cardPending : ""}`}
      style={{ "--status-color": cfg.color } as React.CSSProperties}
    >
      <Link href={`/media/${media.id}`} className={styles.cover} tabIndex={-1}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 30vw, 120px"
            className={styles.coverImg}
          />
        ) : null}
        {behind > 0 && (
          <span className={styles.behindBadge} title={`${behind} aired ${unit.long.toLowerCase()} not watched yet`}>
            {behind} behind
          </span>
        )}
      </Link>

      <div className={styles.cardBody}>
        <span className={styles.statusChip}>
          <span aria-hidden="true">{cfg.icon}</span> {statusLabel(item.status, media.type)}
        </span>
        <h3 className={styles.cardTitle}>
          <Link href={`/media/${media.id}`}>{title}</Link>
        </h3>

        <div className={styles.cardMeta}>
          {item.score ? <span>★ {(item.score / 10).toFixed(1)}</span> : null}
          {media.format ? <span>{media.format.replace(/_/g, " ")}</span> : null}
          {nextEp && now != null && nextEp.airingAt > now ? (
            <span className={styles.airingMeta}>
              Ep {nextEp.episode} in {formatShortCountdown(nextEp.airingAt - now)}
            </span>
          ) : null}
        </div>

        <div className={styles.progressRow}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={max ?? undefined}
            aria-valuenow={progress}
          >
            <div
              className={styles.progressFill}
              style={{ width: percent != null ? `${percent}%` : progress > 0 ? "100%" : "0%" }}
            />
          </div>
          <span className={styles.progressText}>
            {progress}
            {max ? `/${max}` : ""} {unit.short}
          </span>
        </div>

        <div className={styles.cardActions}>
          {canIncrement && (
            <button
              type="button"
              className={styles.plusBtn}
              onClick={increment}
              disabled={pending}
              aria-label={`Mark ${unit.short} ${progress + 1} of ${title} as done`}
            >
              +1 {unit.short}
            </button>
          )}
          <button
            type="button"
            className={styles.editBtn}
            onClick={onEdit}
            aria-label={`Edit ${title}`}
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
