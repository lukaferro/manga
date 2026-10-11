"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
import ScoreStars from "@/components/ScoreStars";
import {
  EDITABLE_STATUSES,
  STATUS_CONFIG,
  progressUnit,
  statusLabel,
} from "@/lib/list-status";
import type { EntryPatch } from "@/lib/use-list";
import type { MediaListEntry, MediaListStatus, MediaType } from "@/lib/types";
import styles from "./ListEntryModal.module.css";

interface ListEntryModalProps {
  open: boolean;
  onClose: () => void;
  mediaType: MediaType;
  maxProgress: number | null | undefined;
  title: string;
  coverImage?: string | null;
  entry: MediaListEntry | null;
  saving?: boolean;
  /** Label of the save button, e.g. "Save to AniList" */
  saveLabel?: string;
  onSave: (patch: EntryPatch) => void;
  onDelete?: () => void;
}

export default function ListEntryModal(props: ListEntryModalProps) {
  const titleId = useId();

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      labelledBy={titleId}
      className={styles.modalCard}
    >
      {/* Keyed so the form re-initialises from the entry every time it opens */}
      <EntryForm key={props.entry?.id ?? "new"} titleId={titleId} {...props} />
    </Modal>
  );
}

function EntryForm({
  titleId,
  onClose,
  mediaType,
  maxProgress,
  title,
  coverImage,
  entry,
  saving,
  saveLabel = "Save",
  onSave,
  onDelete,
}: ListEntryModalProps & { titleId: string }) {
  const [status, setStatus] = useState<MediaListStatus>(entry?.status ?? "CURRENT");
  const [score, setScore] = useState<number>(entry?.score ?? 0);
  const [progress, setProgress] = useState<number>(entry?.progress ?? 0);

  const unit = progressUnit(mediaType);
  const max = maxProgress ?? null;
  const clamp = (value: number) => Math.max(0, max ? Math.min(max, value) : value);
  const progressPercent = max ? Math.min(100, Math.round((progress / max) * 100)) : null;

  // Keep REPEATING selectable if the entry already has it
  const statuses: MediaListStatus[] =
    entry?.status === "REPEATING" ? [...EDITABLE_STATUSES, "REPEATING"] : EDITABLE_STATUSES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ status, score: score > 0 ? score : null, progress });
    onClose();
  }

  return (
    <>
      <div className={styles.modalHeader}>
        {coverImage && (
          <div className={styles.modalThumbWrap}>
            <Image
              src={coverImage}
              alt=""
              width={44}
              height={62}
              className={styles.modalThumb}
            />
          </div>
        )}
        <div className={styles.modalHeaderDetails}>
          <div className={styles.modalSubheading}>
            <span className={styles.modalBadge}>{mediaType}</span>
            {max ? (
              <span className={styles.modalCount}>
                {max} {unit.long}
              </span>
            ) : null}
          </div>
          <h3 id={titleId} className={styles.modalTitle}>
            {title}
          </h3>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.modalBody}>
        <fieldset className={styles.section}>
          <legend className={styles.sectionLabel}>Status</legend>
          <div className={styles.statusGrid} role="radiogroup" aria-label="Status">
            {statuses.map((key) => {
              const cfg = STATUS_CONFIG[key];
              const isSelected = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.statusPill} ${isSelected ? styles.statusPillActive : ""}`}
                  onClick={() => {
                    setStatus(key);
                    if (key === "COMPLETED" && max) setProgress(max);
                  }}
                  style={
                    isSelected
                      ? { borderColor: cfg.color, backgroundColor: cfg.bg, color: cfg.color }
                      : undefined
                  }
                >
                  <span className={styles.pillIcon} aria-hidden="true">
                    {cfg.icon}
                  </span>
                  <span>{statusLabel(key, mediaType)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.section}>
          <div className={styles.sectionHeaderBetween}>
            <label htmlFor={`${titleId}-progress`} className={styles.sectionLabel}>
              {mediaType === "ANIME" ? "Episode Progress" : "Chapter Progress"}
            </label>
            <span className={styles.progressCounterDisplay}>
              <strong>{progress}</strong>
              {max ? ` / ${max}` : ""} {unit.short}
            </span>
          </div>

          {progressPercent != null && (
            <div className={styles.progressBarWrap} aria-hidden="true">
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <div className={styles.stepperRow}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setProgress(clamp(progress - 1))}
              aria-label="Decrease progress"
            >
              –
            </button>
            <input
              id={`${titleId}-progress`}
              type="number"
              min="0"
              max={max ?? 9999}
              value={progress}
              onChange={(e) => setProgress(clamp(parseInt(e.target.value, 10) || 0))}
              className={styles.stepperInput}
            />
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setProgress(clamp(progress + 1))}
              aria-label="Increase progress"
            >
              +
            </button>

            <div className={styles.quickJumps}>
              <button
                type="button"
                className={styles.jumpBtn}
                onClick={() => setProgress(clamp(progress + 5))}
              >
                +5
              </button>
              {max ? (
                <button
                  type="button"
                  className={`${styles.jumpBtn} ${progress === max ? styles.jumpBtnActive : ""}`}
                  onClick={() => setProgress(max)}
                >
                  Max
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <span id={`${titleId}-score`} className={styles.sectionLabel}>
            Your score
          </span>
          <ScoreStars value={score} onChange={setScore} labelledBy={`${titleId}-score`} />
        </div>

        <div className={styles.modalFooter}>
          {entry && onDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => {
                onDelete();
                onClose();
              }}
              disabled={saving}
            >
              Remove
            </button>
          )}
          <div className={styles.rightActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saveLabel}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
