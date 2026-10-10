"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
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

const SCORE_CHIPS = [0, 60, 70, 80, 90, 100];

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
          <div className={styles.sectionHeaderBetween}>
            <label htmlFor={`${titleId}-score`} className={styles.sectionLabel}>
              Score (0 - 100)
            </label>
            <span className={styles.scoreStarsPreview}>
              {score > 0 ? (
                <>
                  <span className={styles.starGlyph}>★</span>
                  <strong>{(score / 10).toFixed(1)}</strong>
                  <span className={styles.scoreTen}>/ 10</span>
                </>
              ) : (
                <span className={styles.noScoreText}>Not Rated</span>
              )}
            </span>
          </div>

          <div className={styles.scoreSliderWrap}>
            <input
              id={`${titleId}-score`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className={styles.rangeSlider}
            />
            <div className={styles.scoreQuickChips}>
              {SCORE_CHIPS.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.scoreChip} ${score === val ? styles.scoreChipActive : ""}`}
                  onClick={() => setScore(val)}
                >
                  {val === 0 ? "None" : `${val / 10}★`}
                </button>
              ))}
            </div>
          </div>
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
