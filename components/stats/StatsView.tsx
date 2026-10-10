"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarList, ScoreColumns } from "@/components/stats/Charts";
import { useSession } from "@/components/SessionProvider";
import { statusLabel } from "@/lib/list-status";
import { computeStats, formatWatchTime } from "@/lib/stats";
import { useListCollection } from "@/lib/use-list";
import type { MediaType } from "@/lib/types";
import styles from "./Stats.module.css";

const STATUS_ORDER = ["CURRENT", "COMPLETED", "PLANNING", "PAUSED", "DROPPED"] as const;
const TOP_GENRES = 10;

export default function StatsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const type: MediaType = searchParams.get("type") === "MANGA" ? "MANGA" : "ANIME";
  const { store, items, loading, error } = useListCollection(type);
  const stats = useMemo(() => computeStats(items), [items]);

  const isAnime = type === "ANIME";
  const nonPlanned = stats.total - stats.byStatus.PLANNING;

  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Stats</h1>
          <p className={styles.subtitle}>
            {store?.kind === "local" ? "From the list saved on this device" : "From your AniList list"}
          </p>
        </div>
        <Link href={`/my-list${isAnime ? "" : "?type=MANGA"}`} className={styles.secondaryBtn}>
          ← Back to My List
        </Link>
      </div>

      <div className={styles.typeSwitch} role="tablist" aria-label="Media type">
        {(["ANIME", "MANGA"] as MediaType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={`${styles.typeBtn} ${type === t ? styles.typeBtnActive : ""}`}
            onClick={() =>
              router.replace(t === "ANIME" ? pathname : `${pathname}?type=MANGA`, { scroll: false })
            }
          >
            {t === "ANIME" ? "Anime" : "Manga"}
          </button>
        ))}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {sessionStatus === "loading" || loading ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : stats.total === 0 ? (
        <div className={styles.empty}>
          <p>No {isAnime ? "anime" : "manga"} on your list yet.</p>
          <Link href={`/browse?type=${type}`} className={styles.primaryBtn}>
            Find something to {isAnime ? "watch" : "read"}
          </Link>
        </div>
      ) : (
        <>
          <section className={styles.tiles} aria-label="Summary">
            <Tile label="Titles" value={stats.total.toLocaleString("en")} />
            <Tile
              label={isAnime ? "Episodes watched" : "Chapters read"}
              value={stats.unitsDone.toLocaleString("en")}
            />
            {isAnime ? (
              <Tile label="Time watched" value={formatWatchTime(stats.minutesWatched)} />
            ) : (
              <Tile label="Completed" value={stats.byStatus.COMPLETED.toLocaleString("en")} />
            )}
            <Tile
              label="Mean score"
              value={stats.meanScore != null ? (stats.meanScore / 10).toFixed(1) : "—"}
              note={stats.scoredCount ? `${stats.scoredCount} rated` : "No ratings yet"}
            />
          </section>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Status</h2>
              <p className={styles.panelSub}>Titles per list status</p>
              <BarList
                unit="titles"
                total={stats.total}
                data={STATUS_ORDER.map((s) => ({
                  label: statusLabel(s, type),
                  value: stats.byStatus[s],
                }))}
              />
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Score distribution</h2>
              <p className={styles.panelSub}>Your ratings on a 1–10 scale</p>
              {stats.scoredCount > 0 ? (
                <ScoreColumns buckets={stats.scoreBuckets} />
              ) : (
                <p className={styles.panelEmpty}>Rate a few titles to see your distribution.</p>
              )}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Top genres</h2>
              <p className={styles.panelSub}>Excluding planned titles</p>
              {stats.genres.length > 0 ? (
                <BarList
                  unit="titles"
                  total={nonPlanned}
                  data={stats.genres.slice(0, TOP_GENRES).map((g) => ({
                    label: g.key,
                    value: g.count,
                    detail:
                      g.meanScore != null
                        ? `mean score ${(g.meanScore / 10).toFixed(1)}`
                        : undefined,
                  }))}
                />
              ) : (
                <p className={styles.panelEmpty}>Nothing here yet.</p>
              )}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Formats</h2>
              <p className={styles.panelSub}>Excluding planned titles</p>
              {stats.formats.length > 0 ? (
                <BarList
                  unit="titles"
                  total={nonPlanned}
                  data={stats.formats.map((f) => ({ label: f.key, value: f.count }))}
                />
              ) : (
                <p className={styles.panelEmpty}>Nothing here yet.</p>
              )}
            </section>

            {stats.decades.length > 1 && (
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Release decade</h2>
                <p className={styles.panelSub}>Excluding planned titles</p>
                <BarList
                  unit="titles"
                  total={nonPlanned}
                  data={stats.decades.map((d) => ({ label: d.key, value: d.count }))}
                />
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>{value}</span>
      {note && <span className={styles.tileNote}>{note}</span>}
    </div>
  );
}
