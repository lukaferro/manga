"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/FilterBar.module.css";

const DEBOUNCE_MS = 400;

interface SearchFieldProps {
  /** Current search from the URL; remount (via key) to reset the input */
  initialValue: string;
  onSearch: (value: string) => void;
}

/** Debounced title search; Enter applies immediately. */
export default function SearchField({ initialValue, onSearch }: SearchFieldProps) {
  const [value, setValue] = useState(initialValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (value === initialValue) return;
    const timer = setTimeout(() => onSearchRef.current(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, initialValue]);

  return (
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
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search anime or manga by title..."
        aria-label="Search by title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch(value.trim());
          }
        }}
      />
      {value && (
        <button
          type="button"
          className={styles.clearSearchBtn}
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          aria-label="Clear search"
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
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
