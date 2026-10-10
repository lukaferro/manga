import { describe, expect, it } from "vitest";
import { statusForProgress } from "@/lib/list-store";
import { countByTab, episodesBehind, filterItems, sortItems } from "@/lib/my-list";
import { makeItem } from "./fixtures";

function titled(romaji: string, english: string | null = null) {
  return { title: { romaji, english, native: null } };
}

describe("statusForProgress", () => {
  it("completes an entry when progress reaches the total", () => {
    expect(statusForProgress("CURRENT", 28, 28)).toBe("COMPLETED");
  });

  it("starts a planned entry once progress is made", () => {
    expect(statusForProgress("PLANNING", 1, 28)).toBe("CURRENT");
  });

  it("keeps the status otherwise, including unknown totals", () => {
    expect(statusForProgress("PAUSED", 3, 28)).toBe("PAUSED");
    expect(statusForProgress("CURRENT", 1200, null)).toBe("CURRENT");
  });
});

describe("list filtering and sorting", () => {
  const items = [
    makeItem({ mediaId: 1, status: "CURRENT", score: 80, updatedAt: 10, media: titled("Bocchi") }),
    makeItem({
      mediaId: 2,
      status: "REPEATING",
      score: 95,
      updatedAt: 30,
      media: titled("Frieren", "Frieren: Beyond Journey's End"),
    }),
    makeItem({ mediaId: 3, status: "PLANNING", score: null, updatedAt: 20, media: titled("Akira") }),
  ];

  it("counts rewatching entries under the current tab", () => {
    expect(countByTab(items)).toMatchObject({ ALL: 3, CURRENT: 2, PLANNING: 1, COMPLETED: 0 });
  });

  it("filters by tab and by any title", () => {
    expect(filterItems(items, "CURRENT", "").map((i) => i.mediaId)).toEqual([1, 2]);
    expect(filterItems(items, "ALL", "journey").map((i) => i.mediaId)).toEqual([2]);
  });

  it("sorts by update time, title and score", () => {
    expect(sortItems(items, "UPDATED").map((i) => i.mediaId)).toEqual([2, 3, 1]);
    expect(sortItems(items, "TITLE").map((i) => i.mediaId)).toEqual([3, 1, 2]);
    expect(sortItems(items, "SCORE").map((i) => i.mediaId)).toEqual([2, 1, 3]);
  });

  it("does not mutate the input", () => {
    const before = items.map((i) => i.mediaId);
    sortItems(items, "TITLE");
    expect(items.map((i) => i.mediaId)).toEqual(before);
  });
});

describe("episodesBehind", () => {
  it("counts aired but unwatched episodes of an airing show", () => {
    const item = makeItem({
      progress: 3,
      media: { status: "RELEASING", nextAiringEpisode: { episode: 7, airingAt: 0 } },
    });
    expect(episodesBehind(item)).toBe(3);
  });

  it("uses the total for finished shows", () => {
    expect(episodesBehind(makeItem({ progress: 20, media: { episodes: 28 } }))).toBe(8);
  });

  it("is zero for planned entries and manga", () => {
    expect(episodesBehind(makeItem({ status: "PLANNING" }))).toBe(0);
    expect(episodesBehind(makeItem({ media: { type: "MANGA", chapters: 100 } }))).toBe(0);
  });
});
