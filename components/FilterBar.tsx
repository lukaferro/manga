"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition, useMemo } from "react";
import CustomSelect from "./CustomSelect";
import styles from "./FilterBar.module.css";

const SEASONS = ["", "WINTER", "SPRING", "SUMMER", "FALL"];
const ALL_FORMATS = [
  "",
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
  "MANGA",
  "NOVEL",
  "ONE_SHOT",
];
const ANIME_FORMATS = ["", "TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const MANGA_FORMATS = ["", "MANGA", "NOVEL", "ONE_SHOT"];

const STATUSES = [
  "",
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];

const SORTS = [
  "POPULARITY_DESC",
  "TRENDING_DESC",
  "SCORE_DESC",
  "START_DATE_DESC",
  "TITLE_ROMAJI",
];

const currentYear = new Date().getFullYear();
const YEARS = [
  "",
  ...Array.from({ length: currentYear - 1969 }, (_, i) => String(currentYear + 1 - i)),
];

const LABELS: Record<string, Record<string, string>> = {
  type: { "": "All", ANIME: "Anime", MANGA: "Manga" },
  season: {
    "": "All",
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    FALL: "Fall",
  },
  format: {
    "": "All",
    TV: "TV",
    TV_SHORT: "TV Short",
    MOVIE: "Movie",
    SPECIAL: "Special",
    OVA: "OVA",
    ONA: "ONA",
    MUSIC: "Music",
    MANGA: "Manga",
    NOVEL: "Novel",
    ONE_SHOT: "One Shot",
  },
  status: {
    "": "All",
    RELEASING: "Releasing",
    FINISHED: "Finished",
    NOT_YET_RELEASED: "Not Yet Released",
    CANCELLED: "Cancelled",
    HIATUS: "Hiatus",
  },
  sort: {
    POPULARITY_DESC: "Popularity",
    TRENDING_DESC: "Trending",
    SCORE_DESC: "Top Score",
    START_DATE_DESC: "Newest Date",
    TITLE_ROMAJI: "Title (A-Z)",
  },
};

interface FilterBarProps {
  initialGenres: string[];
}

export default function FilterBar({ initialGenres }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "";
  const currentGenre = searchParams.get("genre") || "";
  const currentSort = searchParams.get("sort") || "POPULARITY_DESC";
  const currentSeason = searchParams.get("season") || "";
  const currentYearVal = searchParams.get("year") || "";
  const currentFormat = searchParams.get("format") || "";
  const currentStatus = searchParams.get("status") || "";

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync internal search input with URL if changed externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateParams({ search: searchInput });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`/browse?${params.toString()}`, { scroll: false });
    });
  };

  const handleTypeChange = (newType: string) => {
    const updates: Record<string, string | undefined> = { type: newType };
    if (newType === "MANGA") {
      // Clear season when Manga is selected as it has no anime seasons
      updates.season = undefined;
      // If current format is an anime format, clear it
      if (currentFormat && !MANGA_FORMATS.includes(currentFormat)) {
        updates.format = undefined;
      }
    } else if (newType === "ANIME") {
      if (currentFormat && !ANIME_FORMATS.includes(currentFormat)) {
        updates.format = undefined;
      }
    }
    updateParams(updates);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/browse", { scroll: false });
    });
  };

  // Formats available based on current Type
  const availableFormats = useMemo(() => {
    if (currentType === "MANGA") return MANGA_FORMATS;
    if (currentType === "ANIME") return ANIME_FORMATS;
    return ALL_FORMATS;
  }, [currentType]);

  // Count active advanced filters
  const advancedCount = useMemo(() => {
    let count = 0;
    if (currentSeason) count++;
    if (currentYearVal) count++;
    if (currentFormat) count++;
    if (currentStatus) count++;
    return count;
  }, [currentSeason, currentYearVal, currentFormat, currentStatus]);

  // Active filters list for chips/pills
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (currentSearch) {
      chips.push({
        key: "search",
        label: `"${currentSearch}"`,
        onRemove: () => {
          setSearchInput("");
          updateParams({ search: "" });
        },
      });
    }

    if (currentType) {
      chips.push({
        key: "type",
        label: `Type: ${LABELS.type[currentType] || currentType}`,
        onRemove: () => updateParams({ type: "" }),
      });
    }

    if (currentGenre) {
      chips.push({
        key: "genre",
        label: `Genre: ${currentGenre}`,
        onRemove: () => updateParams({ genre: "" }),
      });
    }

    if (currentSort && currentSort !== "POPULARITY_DESC") {
      chips.push({
        key: "sort",
        label: `Sort: ${LABELS.sort[currentSort] || currentSort}`,
        onRemove: () => updateParams({ sort: "POPULARITY_DESC" }),
      });
    }

    if (currentSeason) {
      chips.push({
        key: "season",
        label: `Season: ${LABELS.season[currentSeason] || currentSeason}`,
        onRemove: () => updateParams({ season: "" }),
      });
    }

    if (currentYearVal) {
      chips.push({
        key: "year",
        label: `Year: ${currentYearVal}`,
        onRemove: () => updateParams({ year: "" }),
      });
    }

    if (currentFormat) {
      chips.push({
        key: "format",
        label: `Format: ${LABELS.format[currentFormat] || currentFormat}`,
        onRemove: () => updateParams({ format: "" }),
      });
    }

    if (currentStatus) {
      chips.push({
        key: "status",
        label: `Status: ${LABELS.status[currentStatus] || currentStatus}`,
        onRemove: () => updateParams({ status: "" }),
      });
    }

    return chips;
  }, [
    currentSearch,
    currentType,
    currentGenre,
    currentSort,
    currentSeason,
    currentYearVal,
    currentFormat,
    currentStatus,
  ]);

  return (
    <div className={styles.filterContainer}>
      {/* Top Search & Media Type bar */}
      <div className={styles.primaryRow}>
        {/* Search input with icons */}
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search anime or manga by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateParams({ search: searchInput });
              }
            }}
          />
          {searchInput && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => {
                setSearchInput("");
                updateParams({ search: "" });
              }}
              title="Clear search"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Segmented Control for Type (All | Anime | Manga) */}
        <div className={styles.typeSegmented}>
          {[
            { value: "", label: "All" },
            { value: "ANIME", label: "Anime" },
            { value: "MANGA", label: "Manga" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.typePill} ${
                currentType === item.value ? styles.typePillActive : ""
              }`}
              onClick={() => handleTypeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main filters bar: Genre, Sort & Advanced Toggle */}
      <div className={styles.controlsRow}>
        <div className={styles.quickSelects}>
          {/* Genre Dropdown */}
          <div className={styles.selectItem}>
            <CustomSelect
              label="Genre"
              value={currentGenre}
              options={[
                { value: "", label: "All Genres" },
                ...initialGenres.map((g) => ({ value: g, label: g })),
              ]}
              onChange={(val) => updateParams({ genre: val })}
              searchable
            />
          </div>

          {/* Sort Dropdown */}
          <div className={styles.selectItem}>
            <CustomSelect
              label="Sort by"
              value={currentSort}
              options={SORTS.map((s) => ({
                value: s,
                label: LABELS.sort[s] || s,
              }))}
              onChange={(val) => updateParams({ sort: val })}
            />
          </div>
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          className={`${styles.advancedToggleBtn} ${
            showAdvanced || advancedCount > 0 ? styles.advancedToggleActive : ""
          }`}
          onClick={() => setShowAdvanced(!showAdvanced)}
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
          >
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          <span>More Filters</span>
          {advancedCount > 0 && (
            <span className={styles.filterBadge}>{advancedCount}</span>
          )}
          <svg
            className={`${styles.toggleArrow} ${
              showAdvanced ? styles.toggleArrowOpen : ""
            }`}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Advanced Collapsible Filters */}
      {showAdvanced && (
        <div className={styles.advancedDrawer}>
          <div className={styles.advancedGrid}>
            {/* Season (disabled or hidden if Manga) */}
            {currentType !== "MANGA" && (
              <CustomSelect
                label="Season"
                value={currentSeason}
                options={SEASONS.map((s) => ({
                  value: s,
                  label: s === "" ? "All Seasons" : LABELS.season[s] || s,
                }))}
                onChange={(val) => updateParams({ season: val })}
              />
            )}

            {/* Year */}
            <CustomSelect
              label="Release Year"
              value={currentYearVal}
              options={YEARS.map((y) => ({
                value: y,
                label: y === "" ? "Any Year" : y,
              }))}
              onChange={(val) => updateParams({ year: val })}
              searchable
            />

            {/* Format (contextual) */}
            <CustomSelect
              label="Format"
              value={currentFormat}
              options={availableFormats.map((f) => ({
                value: f,
                label: f === "" ? "All Formats" : LABELS.format[f] || f,
              }))}
              onChange={(val) => updateParams({ format: val })}
            />

            {/* Status */}
            <CustomSelect
              label="Status"
              value={currentStatus}
              options={STATUSES.map((st) => ({
                value: st,
                label: st === "" ? "All Statuses" : LABELS.status[st] || st,
              }))}
              onChange={(val) => updateParams({ status: val })}
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips / Badges */}
      {activeChips.length > 0 && (
        <div className={styles.activeBar}>
          <div className={styles.chipList}>
            <span className={styles.activeLabel}>Active filters:</span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={styles.chip}
                onClick={chip.onRemove}
                title="Remove filter"
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
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.resetLink}
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

