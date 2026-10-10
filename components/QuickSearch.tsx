"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import type { QuickSearchMedia, QuickSearchPerson, QuickSearchResults } from "@/lib/anilist";
import styles from "./QuickSearch.module.css";

const RECENT_KEY = "quicksearch:recent";
const MAX_RECENT = 6;
const DEBOUNCE_MS = 250;

interface ResultItem {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  image: string | null;
  color: string | null;
}

function mediaToItem(m: QuickSearchMedia): ResultItem {
  const title = m.title.romaji || m.title.english || m.title.native || "Untitled";
  const parts = [
    m.type === "ANIME" ? "Anime" : "Manga",
    m.format && m.format !== m.type ? m.format.replace(/_/g, " ") : null,
    m.startDate.year,
    m.averageScore != null ? `★ ${m.averageScore}%` : null,
  ].filter(Boolean);
  return {
    key: `media-${m.id}`,
    href: `/media/${m.id}`,
    title,
    subtitle: parts.join(" · "),
    image: m.coverImage.medium,
    color: m.coverImage.color,
  };
}

function personToItem(p: QuickSearchPerson, kind: "character" | "staff"): ResultItem {
  const role =
    kind === "character" ? "Character" : (p.primaryOccupations?.slice(0, 2).join(", ") || "Staff");
  return {
    key: `${kind}-${p.id}`,
    href: `/${kind}/${p.id}`,
    title: p.name.full || p.name.native || "Unknown",
    subtitle: [role, p.name.native].filter(Boolean).join(" · "),
    image: p.image?.medium ?? null,
    color: null,
  };
}

function readRecent(): ResultItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as ResultItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: ResultItem) {
  try {
    const next = [item, ...readRecent().filter((r) => r.key !== item.key)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode); recents are a convenience only
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detected after mount to keep server and client markup identical
    const id = setTimeout(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), 0);

    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Search anime and manga"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <SearchIcon />
        <span className={styles.triggerLabel}>Search</span>
        <kbd className={styles.kbd}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Quick search"
        className={styles.dialog}
        position="top"
      >
        <SearchPanel onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; items: ResultItem[] } | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<ResultItem[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setRecent(readRecent()), 0);
    return () => clearTimeout(id);
  }, []);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data: QuickSearchResults = await res.json();
        setResults({
          query: trimmed,
          items: [
            ...data.media.map(mediaToItem),
            ...(data.characters ?? []).map((c) => personToItem(c, "character")),
            ...(data.staff ?? []).map((p) => personToItem(p, "staff")),
          ],
        });
        setError(false);
        setActive(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError(true);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const showingRecent = trimmed.length < 2;
  const items = showingRecent ? recent : (results?.items ?? []);
  const loading = !showingRecent && results?.query !== trimmed && !error;

  const go = useCallback(
    (item: ResultItem) => {
      saveRecent(item);
      onClose();
      router.push(item.href);
    },
    [onClose, router],
  );

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) go(item);
      else if (trimmed) {
        onClose();
        router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
      }
    }
  }

  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div className={styles.panel}>
      <div className={styles.inputRow}>
        <SearchIcon />
        <input
          data-autofocus
          type="text"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-activedescendant={items[active] ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label="Search anime and manga"
          placeholder="Search anime, manga, characters, staff…"
          className={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className={styles.spinner} aria-label="Loading" />}
        <button type="button" className={styles.escBtn} onClick={onClose}>
          Esc
        </button>
      </div>

      <div className={styles.body}>
        {showingRecent && recent.length > 0 && (
          <p className={styles.sectionLabel}>Recently viewed</p>
        )}

        {items.length > 0 ? (
          <ul id={listId} role="listbox" ref={listRef} className={styles.list}>
            {items.map((item, i) => (
              <li
                key={item.key}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                data-index={i}
                className={`${styles.option} ${i === active ? styles.optionActive : ""}`}
                onMouseMove={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(item)}
              >
                <span
                  className={styles.thumb}
                  style={{ backgroundColor: item.color ?? undefined }}
                >
                  {item.image ? (
                    <Image src={item.image} alt="" width={40} height={56} />
                  ) : null}
                </span>
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{item.title}</span>
                  <span className={styles.optionSub}>{item.subtitle}</span>
                </span>
                <span className={styles.enterHint} aria-hidden="true">
                  ↵
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            {error
              ? "Search is unavailable right now. Try again in a moment."
              : showingRecent
                ? "Type at least 2 characters to search."
                : loading
                  ? "Searching…"
                  : `No results for “${trimmed}”.`}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <span>
          <kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> navigate
          <kbd className={styles.kbd}>↵</kbd> open
        </span>
        {!showingRecent && (
          <Link
            href={`/browse?search=${encodeURIComponent(trimmed)}`}
            className={styles.allLink}
            onClick={onClose}
          >
            See all results →
          </Link>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
