"use client";

import { useId, useState } from "react";
import styles from "./ExpandableHtml.module.css";

interface ExpandableHtmlProps {
  html: string;
  className?: string;
  /** Collapse only when the HTML is longer than this many characters */
  threshold?: number;
}

/** Renders trusted AniList HTML, collapsed behind "Show more" when long. */
export default function ExpandableHtml({ html, className, threshold = 1400 }: ExpandableHtmlProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const collapsible = html.length > threshold;
  const collapsed = collapsible && !expanded;

  return (
    <div>
      <div
        id={id}
        className={`${className ?? ""} ${collapsed ? styles.collapsed : ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {collapsible && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
