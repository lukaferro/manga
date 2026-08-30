"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CustomSelect from "./CustomSelect";
import styles from "./FilterBar.module.css";

const TYPES = ["", "ANIME", "MANGA"];
const SEASONS = ["", "WINTER", "SPRING", "SUMMER", "FALL"];
const FORMATS = ["", "TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC", "MANGA", "NOVEL", "ONE_SHOT"];
const STATUSES = ["", "RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"];
const SORTS = ["", "POPULARITY_DESC", "TRENDING_DESC", "SCORE_DESC", "START_DATE_DESC", "TITLE_ROMAJI"];

const currentYear = new Date().getFullYear();
const YEARS = ["", ...Array.from({ length: currentYear - 1969 }, (_, i) => String(currentYear + 1 - i))];

const LABELS: Record<string, Record<string, string>> = {
  type: { "": "All", ANIME: "Anime", MANGA: "Manga" },
  season: { "": "All", WINTER: "Winter", SPRING: "Spring", SUMMER: "Summer", FALL: "Fall" },
  format: { "": "All", TV: "TV", TV_SHORT: "TV Short", MOVIE: "Movie", SPECIAL: "Special", OVA: "OVA", ONA: "ONA", MUSIC: "Music", MANGA: "Manga", NOVEL: "Novel", ONE_SHOT: "One Shot" },
  status: { "": "All", RELEASING: "Releasing", FINISHED: "Finished", NOT_YET_RELEASED: "Not Yet Released", CANCELLED: "Cancelled", HIATUS: "Hiatus" },
  sort: { "": "All", POPULARITY_DESC: "Popularity", TRENDING_DESC: "Trending", SCORE_DESC: "Score", START_DATE_DESC: "Start Date", TITLE_ROMAJI: "Title" },
};

interface FilterBarProps {
  initialGenres: string[];
}

export default function FilterBar({ initialGenres }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  const renderSelect = (key: string, options: string[], label: string) => {
    const currentValue = searchParams.get(key) || "";
    
    // Create options list, adding "All" as the first option for most filters
    const selectOptions = key === "sort" 
      ? options.map(v => ({ value: v, label: LABELS[key]?.[v] || v }))
      : ["", ...options.filter(o => o !== "")].map(v => ({ 
          value: v, 
          label: v === "" ? "All" : (LABELS[key]?.[v] || v) 
        }));

    return (
      <CustomSelect
        label={label}
        value={currentValue}
        options={selectOptions}
        onChange={(val) => updateParam(key, val)}
      />
    );
  };

  return (
    <form onSubmit={handleSearchSubmit} className={styles.filterBar}>
      <div className={styles.topSection}>
        <div className={styles.searchField}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anime and manga..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </div>
        <button 
          type="button" 
          onClick={() => {
            router.push("/browse");
            setSearch("");
          }} 
          className={styles.resetButton}
        >
          Reset All
        </button>
      </div>

      <div className={styles.filtersGrid}>
        {renderSelect("type", TYPES, "Type")}
        {renderSelect("genre", initialGenres, "Genre")}
        {renderSelect("season", SEASONS, "Season")}
        {renderSelect("year", YEARS, "Year")}
        {renderSelect("format", FORMATS, "Format")}
        {renderSelect("status", STATUSES, "Status")}
        {renderSelect("sort", SORTS, "Sort")}
      </div>
    </form>
  );
}
