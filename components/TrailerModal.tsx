"use client";

import { useId, useState } from "react";
import Modal from "@/components/Modal";
import type { Trailer } from "@/lib/types";
import styles from "./TrailerModal.module.css";

interface TrailerModalProps {
  trailer: Trailer | null;
  title: string;
}

export default function TrailerModal({ trailer, title }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  if (!trailer || trailer.site?.toLowerCase() !== "youtube" || !trailer.id) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.trailerButton}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className={styles.playIcon}
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Watch Trailer</span>
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        labelledBy={titleId}
        className={styles.modal}
      >
        <div className={styles.header}>
          <h3 id={titleId} className={styles.modalTitle}>
            {title} — Official Trailer
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close trailer"
            data-autofocus
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
              aria-hidden="true"
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
      </Modal>
    </>
  );
}
