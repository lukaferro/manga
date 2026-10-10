"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";
import ListEntryModal from "@/components/ListEntryModal";
import ListCard from "@/components/my-list/ListCard";
import { loginHref, useSession } from "@/components/SessionProvider";
import { STATUS_CONFIG, statusLabel } from "@/lib/list-status";
import { listItemTitle, maxProgress } from "@/lib/list-store";
import {
  LIST_SORTS,
  LIST_TABS,
  countByTab,
  filterItems,
  sortItems,
  type ListSort,
  type ListTab,
} from "@/lib/my-list";
import { useListCollection } from "@/lib/use-list";
import type { ListItem, MediaType } from "@/lib/types";
import styles from "./MyList.module.css";

function tabLabel(tab: ListTab, type: MediaType): string {
  return tab === "ALL" ? "All" : statusLabel(tab, type);
}

export default function MyListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: sessionStatus, user } = useSession();

  const type: MediaType = searchParams.get("type") === "MANGA" ? "MANGA" : "ANIME";
  const tabParam = searchParams.get("tab") as ListTab | null;
  const tab: ListTab = tabParam && LIST_TABS.includes(tabParam) ? tabParam : "ALL";
  const sortParam = searchParams.get("sort") as ListSort | null;
  const sort: ListSort =
    sortParam && LIST_SORTS.some((s) => s.value === sortParam) ? sortParam : "UPDATED";

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ListItem | null>(null);

  const { store, items, loading, error, pending, update, remove, reload } =
    useListCollection(type);

  const counts = useMemo(() => countByTab(items), [items]);
  const visible = useMemo(
    () => sortItems(filterItems(items, tab, query), sort),
    [items, tab, query, sort],
  );

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (sessionStatus === "loading") {
    return <ListSkeleton />;
  }

  if (!store) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon} aria-hidden="true">
          📚
        </p>
        <h2 className={styles.emptyTitle}>Keep track of everything you watch and read</h2>
        <p className={styles.emptyText}>
          Log in with AniList to see your list, update progress and get your stats.
        </p>
        <a href={loginHref(pathname)} className={styles.primaryBtn}>
          Login with AniList
        </a>
      </div>
    );
  }

  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>My List</h1>
          <p className={styles.subtitle}>
            {store.kind === "anilist" && user
              ? `Synced with AniList as ${user.name}`
              : "Saved on this device"}
          </p>
        </div>
        <Link href={`/my-list/stats?type=${type}`} className={styles.secondaryBtn}>
          View Stats
        </Link>
      </div>

      <div className={styles.typeSwitch} role="tablist" aria-label="Media type">
        {(["ANIME", "MANGA"] as MediaType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={`${styles.typeBtn} ${type === t ? styles.typeBtnActive : ""}`}
            onClick={() => setParam("type", t === "ANIME" ? null : t)}
          >
            {t === "ANIME" ? "Anime" : "Manga"}
          </button>
        ))}
      </div>

      <div className={styles.tabs} role="tablist" aria-label="List status">
        {LIST_TABS.map((t) => {
          const color = t === "ALL" ? undefined : STATUS_CONFIG[t].color;
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              style={active && color ? { borderColor: color, color } : undefined}
              onClick={() => setParam("tab", t === "ALL" ? null : t)}
            >
              {tabLabel(t, type)}
              <span className={styles.tabCount}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchWrap}>
          <span className="sr-only">Filter by title</span>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title…"
            className={styles.searchInput}
          />
        </label>
        <div className={styles.sortWrap}>
          <CustomSelect
            label="Sort"
            options={LIST_SORTS}
            value={sort}
            onChange={(v) => setParam("sort", v === "UPDATED" ? null : v)}
          />
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button type="button" onClick={reload} className={styles.linkBtn}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton bare />
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            {items.length === 0 ? "Your list is empty" : "Nothing here"}
          </h2>
          <p className={styles.emptyText}>
            {items.length === 0
              ? `Find something to ${type === "ANIME" ? "watch" : "read"} and add it to your list.`
              : "Try another tab or clear the filter."}
          </p>
          {items.length === 0 && (
            <Link href={`/browse?type=${type}`} className={styles.primaryBtn}>
              Browse {type === "ANIME" ? "Anime" : "Manga"}
            </Link>
          )}
        </div>
      ) : (
        <ul className={styles.grid}>
          {visible.map((item) => (
            <li key={item.mediaId}>
              <ListCard
                item={item}
                pending={pending.has(item.mediaId)}
                onUpdate={(patch) => update(item, patch)}
                onEdit={() => setEditing(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ListEntryModal
          open
          onClose={() => setEditing(null)}
          mediaType={editing.media.type}
          maxProgress={maxProgress(editing.media)}
          title={listItemTitle(editing.media)}
          coverImage={editing.media.coverImage.large ?? editing.media.coverImage.medium}
          entry={editing}
          saveLabel={store.kind === "anilist" ? "Save to AniList" : "Save"}
          onSave={(patch) => update(editing, patch)}
          onDelete={() => remove(editing)}
        />
      )}
    </>
  );
}

export function ListSkeleton({ bare = false }: { bare?: boolean }) {
  const grid = (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
  if (bare) return grid;
  return (
    <>
      <div className={styles.skeletonHeader} />
      {grid}
    </>
  );
}
