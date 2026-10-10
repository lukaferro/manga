import { DEFAULT_SORT, LABELS, type BrowseFilters } from "@/lib/browse-filters";
import styles from "@/components/FilterBar.module.css";

type FilterKey = keyof BrowseFilters;

interface ActiveFilterChipsProps {
  filters: BrowseFilters;
  onRemove: (key: FilterKey) => void;
  onClearAll: () => void;
}

function chipLabel(key: FilterKey, filters: BrowseFilters): string | null {
  const value = filters[key];
  if (value == null || value === "") return null;
  switch (key) {
    case "search":
      return `"${value}"`;
    case "type":
      return `Type: ${LABELS.type[value] ?? value}`;
    case "genre":
      return `Genre: ${value}`;
    case "sort":
      return value === DEFAULT_SORT ? null : `Sort: ${LABELS.sort[value] ?? value}`;
    case "season":
      return `Season: ${LABELS.season[value] ?? value}`;
    case "year":
      return `Year: ${value}`;
    case "format":
      return `Format: ${LABELS.format[value] ?? value}`;
    case "status":
      return `Status: ${LABELS.status[value] ?? value}`;
  }
}

const ORDER: FilterKey[] = ["search", "type", "genre", "sort", "season", "year", "format", "status"];

export default function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const chips = ORDER.map((key) => ({ key, label: chipLabel(key, filters) })).filter(
    (c): c is { key: FilterKey; label: string } => c.label !== null,
  );

  if (chips.length === 0) return null;

  return (
    <div className={styles.activeBar}>
      <div className={styles.chipList}>
        <span className={styles.activeLabel}>Active filters:</span>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={styles.chip}
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
          >
            <span>{chip.label}</span>
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ))}
      </div>

      <button type="button" className={styles.resetLink} onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
