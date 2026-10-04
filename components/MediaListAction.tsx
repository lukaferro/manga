"use client";

import { useState, useEffect } from "react";
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
}

const STATUS_LABELS: Record<string, { ANIME: string; MANGA: string }> = {
  CURRENT: { ANIME: "Watching", MANGA: "Reading" },
  PLANNING: { ANIME: "Plan to Watch", MANGA: "Plan to Read" },
  COMPLETED: { ANIME: "Completed", MANGA: "Completed" },
  PAUSED: { ANIME: "Paused", MANGA: "Paused" },
  DROPPED: { ANIME: "Dropped", MANGA: "Dropped" },
};

export default function MediaListAction({
  mediaId,
  mediaType,
  maxEpisodes,
  maxChapters,
}: MediaListActionProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [entry, setEntry] = useState<MediaListEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState<string>("CURRENT");
  const [score, setScore] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const pathname = usePathname();
  const maxLimit = mediaType === "ANIME" ? maxEpisodes : maxChapters;

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
              setScore(data.entry.score != null ? String(data.entry.score) : "");
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
          score: score ? parseFloat(score) : undefined,
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
        setScore("");
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

  // Not logged in: Show login prompt button
  if (!authenticated) {
    const loginUrl = `/api/auth/login?returnTo=${encodeURIComponent(pathname || `/media/${mediaId}`)}`;
    return (
      <a href={loginUrl} className={styles.loginPromptBtn}>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Add to AniList</span>
      </a>
    );
  }

  const currentLabel = entry
    ? STATUS_LABELS[entry.status]?.[mediaType] || entry.status
    : "Add to List";

  return (
    <div className={styles.wrapper}>
      {/* Main Status Display / Trigger */}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={`${styles.mainButton} ${entry ? styles.inListButton : ""}`}
          onClick={() => setIsOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {entry ? (
              <path d="M20 6 9 17l-5-5" />
            ) : (
              <path d="M12 5v14M5 12h14" />
            )}
          </svg>
          <span className={styles.btnText}>{currentLabel}</span>

          {entry && (
            <span className={styles.entryMeta}>
              {entry.progress != null
                ? `${entry.progress}${maxLimit ? `/${maxLimit}` : ""}`
                : null}
              {entry.score ? ` · ★${entry.score}` : null}
            </span>
          )}
        </button>

        {/* Quick increment button if in list and progress < max */}
        {entry && entry.status !== "COMPLETED" && (
          <button
            type="button"
            className={styles.quickPlusBtn}
            onClick={(e) => handleQuickProgress(1, e)}
            disabled={saving || (maxLimit != null && (entry.progress || 0) >= maxLimit)}
            title="Increment progress by 1"
          >
            +1
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Manage in AniList</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              {/* Status Select */}
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <div className={styles.statusButtons}>
                  {(["CURRENT", "PLANNING", "COMPLETED", "PAUSED", "DROPPED"] as const).map(
                    (st) => {
                      const isSelected = status === st;
                      const label = STATUS_LABELS[st][mediaType];
                      return (
                        <button
                          key={st}
                          type="button"
                          className={`${styles.statusOption} ${
                            isSelected ? styles.statusSelected : ""
                          }`}
                          onClick={() => setStatus(st)}
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {mediaType === "ANIME" ? "Episodes Watched" : "Chapters Read"}
                </label>
                <div className={styles.progressInputWrap}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setProgress(Math.max(0, progress - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={maxLimit ?? 9999}
                    value={progress}
                    onChange={(e) =>
                      setProgress(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={styles.numInput}
                  />
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() =>
                      setProgress(
                        maxLimit ? Math.min(maxLimit, progress + 1) : progress + 1
                      )
                    }
                  >
                    +
                  </button>
                  {maxLimit && (
                    <span className={styles.totalLimit}>/ {maxLimit}</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className={styles.field}>
                <label className={styles.label}>Score (1 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 85"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className={styles.scoreInput}
                />
              </div>

              {/* Actions */}
              <div className={styles.footerActions}>
                {entry && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Remove
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save to AniList"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
