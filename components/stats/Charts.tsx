import styles from "./Stats.module.css";

export interface BarDatum {
  label: string;
  value: number;
  /** Extra text for the tooltip, e.g. "mean score 8.1" */
  detail?: string;
}

function pct(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
}

/**
 * Horizontal bar list: one series in the accent color, category label on
 * the left, value at the bar tip. Each row is a hover/focus target with a
 * tooltip carrying the exact value and share.
 */
export function BarList({
  data,
  total,
  unit,
}: {
  data: BarDatum[];
  total: number;
  unit: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={styles.barList}>
      {data.map((d) => {
        const tip = `${d.label}: ${d.value} ${unit} · ${pct(d.value, total)}${
          d.detail ? ` · ${d.detail}` : ""
        }`;
        return (
          <li key={d.label} className={styles.barRow} tabIndex={0} aria-label={tip}>
            <span className={styles.barLabel}>{d.label}</span>
            <span className={styles.barTrack}>
              <span
                className={styles.bar}
                style={{ width: `calc((100% - 2.75rem) * ${d.value / max})` }}
              />
              <span className={styles.barValue}>{d.value}</span>
            </span>
            <span className={styles.tooltip} role="tooltip">
              {tip}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Score distribution as columns 1-10. Only the tallest column is labeled;
 * the rest is available on hover/focus and in the accessible labels.
 */
export function ScoreColumns({ buckets }: { buckets: number[] }) {
  const max = Math.max(1, ...buckets);
  const peak = buckets.indexOf(Math.max(...buckets));
  const total = buckets.reduce((a, b) => a + b, 0);

  return (
    <div className={styles.columns} role="list" aria-label="Score distribution">
      {buckets.map((count, i) => {
        const label = `${i + 1}`;
        const tip = `Score ${i * 10 + 1}–${(i + 1) * 10}: ${count} ${
          count === 1 ? "title" : "titles"
        } · ${pct(count, total)}`;
        return (
          <div key={label} className={styles.colSlot} role="listitem" tabIndex={0} aria-label={tip}>
            <div className={styles.colArea}>
              {i === peak && count > 0 && <span className={styles.colValue}>{count}</span>}
              <div
                className={styles.col}
                style={{ height: count > 0 ? `${Math.max(2, (count / max) * 100)}%` : "0" }}
              />
            </div>
            <span className={styles.colLabel}>{label}</span>
            <span className={styles.tooltip} role="tooltip">
              {tip}
            </span>
          </div>
        );
      })}
    </div>
  );
}
