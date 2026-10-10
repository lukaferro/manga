"use client";

import { useEffect, useId, useRef, useState } from "react";
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

/**
 * Select with a styled popup, following the WAI-ARIA listbox pattern:
 * arrows/Home/End move the active option, Enter selects, Escape closes,
 * optional type-to-filter input for long lists.
 */
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
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;

  const selectedOption = options.find((opt) => opt.value === value);
  const shouldShowSearch = searchable || options.length > 10;
  const q = filterQuery.trim().toLowerCase();
  const filteredOptions = q
    ? options.filter((opt) => opt.label.toLowerCase().includes(q))
    : options;

  function open() {
    if (disabled) return;
    const selected = options.findIndex((o) => o.value === value);
    setFilterQuery("");
    setActiveIndex(Math.max(0, selected));
    setIsOpen(true);
  }

  function close(returnFocus = true) {
    setIsOpen(false);
    setFilterQuery("");
    if (returnFocus) buttonRef.current?.focus();
  }

  function choose(opt: Option | undefined) {
    if (!opt) return;
    onChange(opt.value);
    close();
  }

  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the popup so keyboard navigation works immediately
    (shouldShowSearch ? searchInputRef.current : listRef.current)?.focus();

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilterQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, shouldShowSearch]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  function handlePopupKeyDown(e: React.KeyboardEvent) {
    const last = filteredOptions.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
        e.preventDefault();
        choose(filteredOptions[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  const optionId = (i: number) => `${baseId}-opt-${i}`;

  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ""}`}
      ref={containerRef}
    >
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.selectWrapper}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          className={`${styles.selectButton} ${isOpen ? styles.buttonActive : ""} ${
            value ? styles.buttonHasValue : ""
          }`}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={(e) => {
            if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              open();
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-labelledby={`${labelId} ${baseId}-value`}
        >
          <span id={`${baseId}-value`} className={styles.selectedText}>
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
            aria-hidden="true"
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
                  aria-label={`Filter ${label.toLowerCase()} options`}
                  aria-controls={listId}
                  aria-activedescendant={
                    filteredOptions[activeIndex] ? optionId(activeIndex) : undefined
                  }
                  value={filterQuery}
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handlePopupKeyDown}
                />
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              className={styles.optionsList}
              role="listbox"
              aria-labelledby={labelId}
              tabIndex={-1}
              aria-activedescendant={
                !shouldShowSearch && filteredOptions[activeIndex]
                  ? optionId(activeIndex)
                  : undefined
              }
              onKeyDown={handlePopupKeyDown}
            >
              {filteredOptions.length === 0 ? (
                <li className={styles.emptyOption}>No options found</li>
              ) : (
                filteredOptions.map((opt, i) => {
                  const isSelected = value === opt.value;
                  return (
                    <li
                      key={opt.value || "__all__"}
                      id={optionId(i)}
                      data-index={i}
                      className={`${styles.option} ${isSelected ? styles.selected : ""} ${
                        i === activeIndex ? styles.optionActive : ""
                      }`}
                      onMouseMove={() => setActiveIndex(i)}
                      onClick={() => choose(opt)}
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
                          aria-hidden="true"
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
