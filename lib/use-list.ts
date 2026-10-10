"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import {
  anilistStore,
  emitListChange,
  onListChange,
  type ListStore,
  type SaveEntryInput,
} from "./list-store";
import { LOCAL_LIST_KEY, localListStore } from "./local-list-store";
import type { ListItem, ListMedia, MediaListEntry, MediaType } from "./types";

/**
 * The active store: AniList when logged in, the device-local guest list
 * otherwise, or null while the session is still loading.
 */
export function useListStore(): ListStore | null {
  const { status } = useSession();
  if (status === "authenticated") return anilistStore;
  if (status === "guest") return localListStore;
  return null;
}

/** Re-read the guest list when another tab changes it. */
function useCrossTabReload(store: ListStore | null): number {
  const [token, setToken] = useState(0);
  useEffect(() => {
    if (store?.kind !== "local") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_LIST_KEY || e.key === null) setToken((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [store]);
  return token;
}

export type EntryPatch = Omit<SaveEntryInput, "mediaId" | "media">;

interface Loaded<T> {
  key: string;
  data: T;
  error: string | null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

/* ------------------------------------------------------------------ */
/* Single entry (detail page)                                          */
/* ------------------------------------------------------------------ */

export function useListEntry(mediaId: number, media?: ListMedia) {
  const store = useListStore();
  const key = store ? `${store.kind}:${mediaId}` : "";
  const [state, setState] = useState<Loaded<MediaListEntry | null> | null>(null);
  const [saving, setSaving] = useState(false);
  const crossTabToken = useCrossTabReload(store);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .getEntry(mediaId)
      .then((entry) => !cancelled && setState({ key, data: entry, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [store, mediaId, key, crossTabToken]);

  useEffect(
    () =>
      onListChange((change) => {
        if (change.kind === "save" && change.entry.mediaId === mediaId) {
          setState((s) => (s ? { ...s, data: change.entry, error: null } : s));
        } else if (change.kind === "remove" && change.mediaId === mediaId) {
          setState((s) => (s ? { ...s, data: null, error: null } : s));
        }
      }),
    [mediaId],
  );

  const current = state && state.key === key ? state : null;
  const entry = current?.data ?? null;

  const save = useCallback(
    async (patch: EntryPatch) => {
      if (!store) return;
      const previous = entry;
      // Optimistic update, rolled back if the store rejects it
      setState({
        key,
        error: null,
        data: {
          id: previous?.id ?? -1,
          mediaId,
          score: patch.score ?? null,
          progress: patch.progress ?? null,
          status: patch.status,
        },
      });
      setSaving(true);
      try {
        const saved = await store.save({ ...patch, mediaId, media });
        emitListChange({ kind: "save", entry: saved, media });
      } catch (err) {
        setState({ key, data: previous, error: errorMessage(err) });
      } finally {
        setSaving(false);
      }
    },
    [store, entry, key, mediaId, media],
  );

  const remove = useCallback(async () => {
    if (!store || !entry) return;
    const previous = entry;
    setState({ key, data: null, error: null });
    setSaving(true);
    try {
      await store.remove(previous);
      emitListChange({ kind: "remove", mediaId });
    } catch (err) {
      setState({ key, data: previous, error: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }, [store, entry, key, mediaId]);

  return {
    store,
    entry,
    loading: store !== null && current === null,
    error: current?.error ?? null,
    saving,
    save,
    remove,
  };
}

/* ------------------------------------------------------------------ */
/* Whole collection (My List, stats, schedule highlighting)            */
/* ------------------------------------------------------------------ */

export function useListCollection(type: MediaType) {
  const store = useListStore();
  const key = store ? `${store.kind}:${type}` : "";
  const [state, setState] = useState<Loaded<ListItem[]> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pending, setPending] = useState<Set<number>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const crossTabToken = useCrossTabReload(store);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .getCollection(type)
      .then((items) => !cancelled && setState({ key, data: items, error: null }))
      .catch((err) => !cancelled && setState({ key, data: [], error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [store, type, key, reloadToken, crossTabToken]);

  useEffect(
    () =>
      onListChange((change) => {
        setState((s) => {
          if (!s) return s;
          if (change.kind === "remove") {
            return { ...s, data: s.data.filter((i) => i.mediaId !== change.mediaId) };
          }
          const existing = s.data.find((i) => i.mediaId === change.entry.mediaId);
          if (existing) {
            return {
              ...s,
              data: s.data.map((i) =>
                i.mediaId === change.entry.mediaId ? { ...i, ...change.entry } : i,
              ),
            };
          }
          if (change.media && change.media.type === type) {
            return { ...s, data: [{ ...change.entry, media: change.media }, ...s.data] };
          }
          return s;
        });
      }),
    [type],
  );

  const current = state && state.key === key ? state : null;

  const setPendingFor = (mediaId: number, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(mediaId);
      else next.delete(mediaId);
      return next;
    });

  const update = useCallback(
    async (item: ListItem, patch: EntryPatch) => {
      if (!store) return;
      const optimistic: ListItem = {
        ...item,
        ...patch,
        score: patch.score ?? null,
        progress: patch.progress ?? null,
        updatedAt: Math.floor(Date.now() / 1000),
      };
      setActionError(null);
      setPendingFor(item.mediaId, true);
      setState((s) =>
        s
          ? { ...s, data: s.data.map((i) => (i.mediaId === item.mediaId ? optimistic : i)) }
          : s,
      );
      try {
        const saved = await store.save({ ...patch, mediaId: item.mediaId, media: item.media });
        emitListChange({ kind: "save", entry: saved, media: item.media });
      } catch (err) {
        setActionError(errorMessage(err));
        setState((s) =>
          s ? { ...s, data: s.data.map((i) => (i.mediaId === item.mediaId ? item : i)) } : s,
        );
      } finally {
        setPendingFor(item.mediaId, false);
      }
    },
    [store],
  );

  const remove = useCallback(
    async (item: ListItem) => {
      if (!store) return;
      setActionError(null);
      setPendingFor(item.mediaId, true);
      try {
        await store.remove(item);
        emitListChange({ kind: "remove", mediaId: item.mediaId });
      } catch (err) {
        setActionError(errorMessage(err));
      } finally {
        setPendingFor(item.mediaId, false);
      }
    },
    [store],
  );

  return {
    store,
    items: current?.data ?? [],
    loading: store !== null && current === null,
    error: current?.error ?? actionError,
    pending,
    update,
    remove,
    reload: () => setReloadToken((t) => t + 1),
  };
}
