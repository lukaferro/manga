"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ListEntryModal from "@/components/ListEntryModal";
import { loginHref, useSession } from "@/components/SessionProvider";
import { STATUS_CONFIG, progressUnit, statusLabel } from "@/lib/list-status";
import { listItemTitle, maxProgress, statusForProgress } from "@/lib/list-store";
import { useListEntry } from "@/lib/use-list";
import type { ListMedia } from "@/lib/types";
import styles from "./MediaListAction.module.css";

interface MediaListActionProps {
  media: ListMedia;
}

export default function MediaListAction({ media }: MediaListActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const { store, entry, loading, error, saving, save, remove } = useListEntry(
    media.id,
    media,
  );

  const max = maxProgress(media);
  const unit = progressUnit(media.type);
  const title = listItemTitle(media);

  if (sessionStatus === "loading" || loading) {
    return <div className={styles.loadingSkeleton} />;
  }

  if (store === null) {
    return <LoginPrompt pathname={pathname || `/media/${media.id}`} />;
  }

  const handleQuickProgress = () => {
    if (!entry) return;
    const progress = (entry.progress ?? 0) + 1;
    save({
      status: statusForProgress(entry.status, progress, max),
      progress,
      score: entry.score,
    });
  };

  const cfg = entry ? STATUS_CONFIG[entry.status] : null;
  const saveLabel = store.kind === "anilist" ? "Save to AniList" : "Save";

  return (
    <div className={styles.wrapper}>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={`${styles.mainButton} ${entry ? styles.inListButton : ""}`}
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          style={
            entry && cfg ? { borderColor: cfg.color, backgroundColor: cfg.bg } : undefined
          }
        >
          <span className={styles.statusIcon} aria-hidden="true">
            {cfg ? cfg.icon : "+"}
          </span>
          <span className={styles.btnText}>
            {entry ? statusLabel(entry.status, media.type) : "Add to List"}
          </span>

          {entry && (
            <span className={styles.entryMeta}>
              {`${entry.progress ?? 0}${max ? `/${max}` : ""} ${unit.short}`}
              {entry.score ? ` · ★${(entry.score / 10).toFixed(1)}` : null}
            </span>
          )}
        </button>

        {entry && entry.status !== "COMPLETED" && (
          <button
            type="button"
            className={styles.quickPlusBtn}
            onClick={handleQuickProgress}
            disabled={saving || (max != null && (entry.progress ?? 0) >= max)}
            title={`Mark next ${unit.short} as done`}
            aria-label={`Mark next ${unit.short} as done`}
          >
            +1
          </button>
        )}
      </div>

      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      <ListEntryModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        mediaType={media.type}
        maxProgress={max}
        title={title}
        coverImage={media.coverImage.large ?? media.coverImage.medium}
        entry={entry}
        saving={saving}
        saveLabel={saveLabel}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}

function LoginPrompt({ pathname }: { pathname: string }) {
  return (
    <div className={styles.loginCardWrap}>
      <a href={loginHref(pathname)} className={styles.loginPromptBtn}>
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
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
