"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./CustomSelect.module.css";

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = false,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setFilterQuery("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = useMemo(() => {
    if (!filterQuery.trim()) return options;
    const q = filterQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, filterQuery]);

  const shouldShowSearch = searchable || options.length > 10;

  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ""}`}
      ref={containerRef}
    >
      <label className={styles.label}>{label}</label>
      <div className={styles.selectWrapper}>
        <button
          type="button"
          disabled={disabled}
          className={`${styles.selectButton} ${isOpen ? styles.buttonActive : ""} ${
            value ? styles.buttonHasValue : ""
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.selectedText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {shouldShowSearch && (
              <div className={styles.searchWrapper}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.dropdownSearch}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <ul className={styles.optionsList} role="listbox">
              {filteredOptions.length === 0 ? (
                <li className={styles.emptyOption}>No options found</li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <li
                      key={opt.value || "__all__"}
                      className={`${styles.option} ${
                        isSelected ? styles.selected : ""
                      }`}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <svg
                          className={styles.checkIcon}
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

