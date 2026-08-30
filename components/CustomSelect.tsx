"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./CustomSelect.module.css";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.selectedText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <ul className={styles.optionsList} role="listbox">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`${styles.option} ${value === opt.value ? styles.selected : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={value === opt.value}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
