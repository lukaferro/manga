"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ActiveFilterChips from "@/components/browse/ActiveFilterChips";
import SearchField from "@/components/browse/SearchField";
import CustomSelect from "@/components/CustomSelect";
import {
  ANIME_FORMATS,
  DEFAULT_SORT,
  LABELS,
  MANGA_FORMATS,
  SEASONS,
  SORTS,
  STATUSES,
  formatsForType,
  parseBrowseParams,
  type BrowseFilters,
} from "@/lib/browse-filters";
import type { MediaFormat } from "@/lib/types";
import styles from "./FilterBar.module.css";

const FIRST_YEAR = 1970;

function yearOptions() {
  const latest = new Date().getFullYear() + 1;
  return [
    { value: "", label: "Any Year" },
    ...Array.from({ length: latest - FIRST_YEAR + 1 }, (_, i) => {
      const y = String(latest - i);
      return { value: y, label: y };
    }),
  ];
}

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
];

interface FilterBarProps {
  initialGenres: string[];
}

export default function FilterBar({ initialGenres }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [years] = useState(yearOptions);

  const { filters } = parseBrowseParams((key) => searchParams.get(key));

  const updateParams = useCallback(
    (updates: Partial<Record<keyof BrowseFilters, string | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      // Results restart from the first page whenever filters change
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/browse?${qs}` : "/browse", { scroll: false });
      });
    },
    [router, searchParams],
  );

  function handleTypeChange(newType: string) {
    const updates: Partial<Record<keyof BrowseFilters, string | undefined>> = { type: newType };
    const format = filters.format;
    if (newType === "MANGA") {
      // Manga has no broadcast seasons
      updates.season = undefined;
      if (format && !MANGA_FORMATS.includes(format)) updates.format = undefined;
    } else if (newType === "ANIME" && format && !ANIME_FORMATS.includes(format)) {
      updates.format = undefined;
    }
    updateParams(updates);
  }

  const advancedCount = [filters.season, filters.year, filters.format, filters.status].filter(
    Boolean,
  ).length;

  return (
    <div className={styles.filterContainer} aria-busy={isPending}>
      <div className={styles.primaryRow}>
        <SearchField
          key={filters.search ?? ""}
          initialValue={filters.search ?? ""}
          onSearch={(search) => updateParams({ search })}
        />

        <div className={styles.typeSegmented} role="group" aria-label="Media type">
          {TYPE_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={(filters.type ?? "") === item.value}
              className={`${styles.typePill} ${
                (filters.type ?? "") === item.value ? styles.typePillActive : ""
              }`}
              onClick={() => handleTypeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.quickSelects}>
          <div className={styles.selectItem}>
            <CustomSelect
              label="Genre"
              value={filters.genre ?? ""}
              options={[
                { value: "", label: "All Genres" },
                ...initialGenres.map((g) => ({ value: g, label: g })),
              ]}
              onChange={(genre) => updateParams({ genre })}
              searchable
            />
          </div>

          <div className={styles.selectItem}>
            <CustomSelect
              label="Sort by"
              value={filters.sort ?? DEFAULT_SORT}
              options={SORTS.map((s) => ({ value: s, label: LABELS.sort[s] }))}
              onChange={(sort) => updateParams({ sort: sort === DEFAULT_SORT ? "" : sort })}
            />
          </div>
        </div>

        <button
          type="button"
          className={`${styles.advancedToggleBtn} ${
            showAdvanced || advancedCount > 0 ? styles.advancedToggleActive : ""
          }`}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          <span>More Filters</span>
          {advancedCount > 0 && <span className={styles.filterBadge}>{advancedCount}</span>}
          <svg
            className={`${styles.toggleArrow} ${showAdvanced ? styles.toggleArrowOpen : ""}`}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedDrawer}>
          <div className={styles.advancedGrid}>
            {filters.type !== "MANGA" && (
              <CustomSelect
                label="Season"
                value={filters.season ?? ""}
                options={[
                  { value: "", label: "All Seasons" },
                  ...SEASONS.map((s) => ({ value: s, label: LABELS.season[s] })),
                ]}
                onChange={(season) => updateParams({ season })}
              />
            )}

            <CustomSelect
              label="Release Year"
              value={filters.year ? String(filters.year) : ""}
              options={years}
              onChange={(year) => updateParams({ year })}
              searchable
            />

            <CustomSelect
              label="Format"
              value={filters.format ?? ""}
              options={[
                { value: "", label: "All Formats" },
                ...formatsForType(filters.type).map((f: MediaFormat) => ({
                  value: f,
                  label: LABELS.format[f],
                })),
              ]}
              onChange={(format) => updateParams({ format })}
            />

            <CustomSelect
              label="Status"
              value={filters.status ?? ""}
              options={[
                { value: "", label: "All Statuses" },
                ...STATUSES.map((s) => ({ value: s, label: LABELS.status[s] })),
              ]}
              onChange={(status) => updateParams({ status })}
            />
          </div>
        </div>
      )}

      <ActiveFilterChips
        filters={filters}
        onRemove={(key) => updateParams({ [key]: undefined })}
        onClearAll={() =>
          startTransition(() => {
            router.push("/browse", { scroll: false });
          })
        }
      />
    </div>
  );
}
