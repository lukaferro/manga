"use client";

import { useState, useEffect } from "react";
import type { Trailer } from "@/lib/types";
import styles from "./TrailerModal.module.css";

interface TrailerModalProps {
  trailer: Trailer | null;
  title: string;
}

export default function TrailerModal({ trailer, title }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!trailer || trailer.site?.toLowerCase() !== "youtube" || !trailer.id) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.trailerButton}
        onClick={() => setIsOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className={styles.playIcon}
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Watch Trailer</span>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} Trailer`}
          >
            <div className={styles.header}>
              <h3 className={styles.modalTitle}>{title} — Official Trailer</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close trailer"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.videoContainer}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=1&rel=0`}
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.iframe}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
