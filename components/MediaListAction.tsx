"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./MediaListAction.module.css";

interface MediaListEntry {
  id: number;
  mediaId: number;
  status: "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";
  score: number | null;
  progress: number | null;
}

interface MediaListActionProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  maxEpisodes?: number | null;
  maxChapters?: number | null;
  mediaTitle?: string;
  coverImage?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    labelAnime: string;
    labelManga: string;
    icon: string;
    color: string;
    bg: string;
  }
> = {
  CURRENT: {
    labelAnime: "Watching",
    labelManga: "Reading",
    icon: "▶",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
  },
  PLANNING: {
    labelAnime: "Plan to Watch",
    labelManga: "Plan to Read",
    icon: "🔖",
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.15)",
  },
  COMPLETED: {
    labelAnime: "Completed",
    labelManga: "Completed",
    icon: "✓",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.15)",
  },
  PAUSED: {
    labelAnime: "Paused",
    labelManga: "Paused",
    icon: "⏸",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
  },
  DROPPED: {
    labelAnime: "Dropped",
    labelManga: "Dropped",
    icon: "✕",
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.15)",
  },
};

export default function MediaListAction({
  mediaId,
  mediaType,
  maxEpisodes,
  maxChapters,
  mediaTitle,
  coverImage,
}: MediaListActionProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [entry, setEntry] = useState<MediaListEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState<string>("CURRENT");
  const [score, setScore] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const pathname = usePathname();
  const maxLimit = mediaType === "ANIME" ? maxEpisodes : maxChapters;
  const unitLabel = mediaType === "ANIME" ? "Ep" : "Ch";

  useEffect(() => {
    let isMounted = true;

    async function loadEntry() {
      try {
        const res = await fetch(`/api/media-list?mediaId=${mediaId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAuthenticated(data.authenticated);
            if (data.entry) {
              setEntry(data.entry);
              setStatus(data.entry.status || "CURRENT");
              setScore(data.entry.score != null ? Number(data.entry.score) : 0);
              setProgress(data.entry.progress || 0);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load list entry:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/media-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          status,
          score: score > 0 ? score : undefined,
          progress: progress != null ? progress : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error saving entry:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setSaving(true);

    try {
      const res = await fetch("/api/media-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });

      if (res.ok) {
        setEntry(null);
        setProgress(0);
        setScore(0);
        setStatus("CURRENT");
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickProgress = async (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry) return;

    const newProgress = Math.max(0, (entry.progress || 0) + delta);
    const newStatus =
      maxLimit && newProgress >= maxLimit ? "COMPLETED" : entry.status;

    setSaving(true);
    try {
      const res = await fetch("/api/media-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          status: newStatus,
          progress: newProgress,
          score: entry.score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry);
        setProgress(newProgress);
        if (newStatus) setStatus(newStatus);
      }
    } catch (err) {
      console.error("Quick progress error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingSkeleton} />;
  }

  // Not logged in: Show informative sign-in prompt button
  if (!authenticated) {
    const loginUrl = `/api/auth/login?returnTo=${encodeURIComponent(
      pathname || `/media/${mediaId}`
    )}`;
    return (
      <div className={styles.loginCardWrap}>
        <a href={loginUrl} className={styles.loginPromptBtn}>
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add to AniList</span>
        </a>
        <p className={styles.loginHelperText}>
          Login with AniList to track your progress & score.
        </p>
      </div>
    );
  }

  const currentCfg = entry ? STATUS_CONFIG[entry.status] : null;
  const currentLabel = entry
    ? (mediaType === "ANIME" ? currentCfg?.labelAnime : currentCfg?.labelManga) ||
      entry.status
    : "Add to List";

  const progressPercent = maxLimit
    ? Math.min(100, Math.round((progress / maxLimit) * 100))
    : null;

  return (
    <div className={styles.wrapper}>
      {/* Trigger Row */}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={`${styles.mainButton} ${entry ? styles.inListButton : ""}`}
          onClick={() => setIsOpen(true)}
          style={
            entry && currentCfg
              ? ({
                  borderColor: currentCfg.color,
                  backgroundColor: currentCfg.bg,
                } as React.CSSProperties)
              : undefined
          }
        >
          <span className={styles.statusIcon}>
            {entry && currentCfg ? currentCfg.icon : "+"}
          </span>
          <span className={styles.btnText}>{currentLabel}</span>

          {entry && (
            <span className={styles.entryMeta}>
              {entry.progress != null
                ? `${entry.progress}${maxLimit ? `/${maxLimit}` : ""} ${unitLabel}`
                : null}
              {entry.score ? ` · ★${entry.score}` : null}
            </span>
          )}
        </button>

        {/* Quick increment button */}
        {entry && entry.status !== "COMPLETED" && (
          <button
            type="button"
            className={styles.quickPlusBtn}
            onClick={(e) => handleQuickProgress(1, e)}
            disabled={saving || (maxLimit != null && (entry.progress || 0) >= maxLimit)}
            title={`Watch next ${unitLabel}`}
          >
            +1
          </button>
        )}
      </div>

      {/* Modern Modal */}
      {isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header with Thumbnail preview */}
            <div className={styles.modalHeader}>
              {coverImage && (
                <div className={styles.modalThumbWrap}>
                  <Image
                    src={coverImage}
                    alt={mediaTitle || "Cover"}
                    width={44}
                    height={62}
                    className={styles.modalThumb}
                  />
                </div>
              )}
              <div className={styles.modalHeaderDetails}>
                <div className={styles.modalSubheading}>
                  <span className={styles.modalBadge}>{mediaType}</span>
                  {maxLimit ? (
                    <span className={styles.modalCount}>
                      {maxLimit} {mediaType === "ANIME" ? "Episodes" : "Chapters"}
                    </span>
                  ) : null}
                </div>
                <h3 className={styles.modalTitle}>
                  {mediaTitle || "Manage Entry"}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalBody}>
              {/* Status Picker Pills */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Status</label>
                <div className={styles.statusGrid}>
                  {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                    const isSelected = status === stKey;
                    const label =
                      mediaType === "ANIME" ? cfg.labelAnime : cfg.labelManga;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        className={`${styles.statusPill} ${
                          isSelected ? styles.statusPillActive : ""
                        }`}
                        onClick={() => setStatus(stKey)}
                        style={
                          isSelected
                            ? {
                                borderColor: cfg.color,
                                backgroundColor: cfg.bg,
                                color: cfg.color,
                              }
                            : undefined
                        }
                      >
                        <span className={styles.pillIcon}>{cfg.icon}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Slider / Stepper */}
              <div className={styles.section}>
                <div className={styles.sectionHeaderBetween}>
                  <label className={styles.sectionLabel}>
                    {mediaType === "ANIME" ? "Episode Progress" : "Chapter Progress"}
                  </label>
                  <span className={styles.progressCounterDisplay}>
                    <strong>{progress}</strong>
                    {maxLimit ? ` / ${maxLimit}` : ""} {unitLabel}
                  </span>
                </div>

                {/* Progress bar visual */}
                {maxLimit && progressPercent != null && (
                  <div className={styles.progressBarWrap}>
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
                    onClick={() => setProgress(Math.max(0, progress - 1))}
                    title="-1"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={maxLimit ?? 9999}
                    value={progress}
                    onChange={(e) =>
                      setProgress(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={styles.stepperInput}
                  />
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() =>
                      setProgress(
                        maxLimit ? Math.min(maxLimit, progress + 1) : progress + 1
                      )
                    }
                    title="+1"
                  >
                    +
                  </button>

                  {/* Quick Jump Buttons */}
                  <div className={styles.quickJumps}>
                    <button
                      type="button"
                      className={styles.jumpBtn}
                      onClick={() =>
                        setProgress(
                          maxLimit ? Math.min(maxLimit, progress + 5) : progress + 5
                        )
                      }
                    >
                      +5
                    </button>
                    {maxLimit && (
                      <button
                        type="button"
                        className={`${styles.jumpBtn} ${
                          progress === maxLimit ? styles.jumpBtnActive : ""
                        }`}
                        onClick={() => setProgress(maxLimit)}
                      >
                        Max
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Score rating with visual star preview */}
              <div className={styles.section}>
                <div className={styles.sectionHeaderBetween}>
                  <label className={styles.sectionLabel}>Score (0 - 100)</label>
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
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                  <div className={styles.scoreQuickChips}>
                    {[0, 60, 70, 80, 90, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`${styles.scoreChip} ${
                          score === val ? styles.scoreChipActive : ""
                        }`}
                        onClick={() => setScore(val)}
                      >
                        {val === 0 ? "None" : `${val / 10}★`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.modalFooter}>
                {entry && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? "..." : "Remove"}
                  </button>
                )}
                <div className={styles.rightActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save to AniList"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
