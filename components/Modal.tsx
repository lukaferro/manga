"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the element that labels the dialog */
  labelledBy?: string;
  ariaLabel?: string;
  /** Class for the dialog card (size, colors) */
  className?: string;
  /** Vertical placement: centered or near the top (command palette style) */
  position?: "center" | "top";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: portal to <body>, focus trap, Escape to close,
 * body scroll lock and focus restoration to the previously focused element.
 */
export default function Modal({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  className,
  position = "center",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    // Focus the first focusable element, unless something inside already has focus
    if (dialog && !dialog.contains(document.activeElement)) {
      const first = dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        dialog.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialog).focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${position === "top" ? styles.top : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
