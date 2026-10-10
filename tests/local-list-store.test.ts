import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_LIST_KEY,
  clearLocalList,
  localListItems,
  localListStore,
} from "@/lib/local-list-store";
import { makeMedia } from "./fixtures";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

describe("localListStore", () => {
  it("saves, reads and lists entries by type", async () => {
    await localListStore.save({
      mediaId: 1,
      status: "CURRENT",
      progress: 3,
      score: 85,
      media: makeMedia({ id: 1 }),
    });
    await localListStore.save({
      mediaId: 2,
      status: "PLANNING",
      media: makeMedia({ id: 2, type: "MANGA" }),
    });

    expect(await localListStore.getEntry(1)).toMatchObject({
      mediaId: 1,
      status: "CURRENT",
      progress: 3,
      score: 85,
    });
    expect((await localListStore.getCollection("ANIME")).map((i) => i.mediaId)).toEqual([1]);
    expect((await localListStore.getCollection("MANGA")).map((i) => i.mediaId)).toEqual([2]);
  });

  it("updates an entry keeping its media snapshot", async () => {
    await localListStore.save({ mediaId: 1, status: "CURRENT", progress: 1, media: makeMedia({ id: 1 }) });
    await localListStore.save({ mediaId: 1, status: "COMPLETED", progress: 28 });
    const [item] = localListItems();
    expect(item.status).toBe("COMPLETED");
    expect(item.media.episodes).toBe(28);
  });

  it("normalises scores and progress", async () => {
    const entry = await localListStore.save({
      mediaId: 1,
      status: "CURRENT",
      score: 0,
      progress: -2,
      media: makeMedia(),
    });
    expect(entry.score).toBeNull();
    expect(entry.progress).toBe(0);
  });

  it("requires media details for a new entry", async () => {
    await expect(localListStore.save({ mediaId: 9, status: "CURRENT" })).rejects.toThrow();
  });

  it("removes entries and recovers from corrupt storage", async () => {
    await localListStore.save({ mediaId: 1, status: "CURRENT", media: makeMedia() });
    await localListStore.remove({ id: 1, mediaId: 1, status: "CURRENT", score: null, progress: null });
    expect(localListItems()).toEqual([]);

    localStorage.setItem(LOCAL_LIST_KEY, "{not json");
    expect(localListItems()).toEqual([]);
    clearLocalList();
    expect(localStorage.getItem(LOCAL_LIST_KEY)).toBeNull();
  });
});
