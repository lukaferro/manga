"use client";

import { useEffect, useState } from "react";
import { anilistStore, emitListChange } from "@/lib/list-store";
import { clearLocalList, localListItems, removeLocalItem } from "@/lib/local-list-store";
import type { ListItem } from "@/lib/types";
import styles from "./MyList.module.css";

// Spacing between AniList mutations to stay well under the rate limit
const IMPORT_DELAY_MS = 800;

type Phase =
  | { kind: "idle" }
  | { kind: "importing"; done: number; total: number }
  | { kind: "done"; imported: number }
  | { kind: "error"; message: string; done: number };

/**
 * Shown to logged-in users who still have titles saved in guest mode:
 * offers to copy them to AniList (skipping titles already on the list).
 */
export default function GuestImportBanner({ existingIds }: { existingIds: Set<number> }) {
  const [pendingItems, setPendingItems] = useState<ListItem[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setPendingItems(localListItems()), 0);
    return () => clearTimeout(id);
  }, []);

  if (dismissed || (pendingItems.length === 0 && phase.kind !== "done")) return null;

  async function runImport() {
    const toImport = pendingItems.filter((i) => !existingIds.has(i.mediaId));
    let done = 0;
    setPhase({ kind: "importing", done, total: toImport.length });

    for (const item of toImport) {
      try {
        const saved = await anilistStore.save({
          mediaId: item.mediaId,
          status: item.status,
          score: item.score,
          progress: item.progress,
        });
        removeLocalItem(item.mediaId);
        emitListChange({ kind: "save", entry: saved, media: item.media });
        done++;
        setPhase({ kind: "importing", done, total: toImport.length });
        await new Promise((r) => setTimeout(r, IMPORT_DELAY_MS));
      } catch (err) {
        setPhase({
          kind: "error",
          done,
          message: err instanceof Error ? err.message : "Import failed",
        });
        setPendingItems(localListItems());
        return;
      }
    }

    // Titles already on AniList are kept there; the local copies are no longer needed
    clearLocalList();
    setPendingItems([]);
    setPhase({ kind: "done", imported: done });
  }

  function discard() {
    clearLocalList();
    setPendingItems([]);
    setDismissed(true);
  }

  if (phase.kind === "done") {
    return (
      <div className={styles.infoBanner} role="status">
        <span>
          Imported {phase.imported} {phase.imported === 1 ? "title" : "titles"} to AniList.
        </span>
        <button type="button" className={styles.linkBtn} onClick={() => setDismissed(true)}>
          Close
        </button>
      </div>
    );
  }

  const count = pendingItems.length;

  return (
    <div className={styles.infoBanner} role="region" aria-label="Import guest list">
      <div>
        <strong>
          {count} {count === 1 ? "title" : "titles"} saved on this device
        </strong>
        <p className={styles.bannerText}>
          {phase.kind === "importing"
            ? `Importing… ${phase.done}/${phase.total}`
            : phase.kind === "error"
              ? `Stopped after ${phase.done}: ${phase.message}`
              : "Import them into your AniList account? Titles already on your list are kept as they are."}
        </p>
      </div>
      <div className={styles.bannerActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={runImport}
          disabled={phase.kind === "importing"}
        >
          {phase.kind === "error" ? "Retry import" : "Import to AniList"}
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={discard}
          disabled={phase.kind === "importing"}
        >
          Discard
        </button>
      </div>
    </div>
  );
}
