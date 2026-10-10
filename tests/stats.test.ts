import { describe, expect, it } from "vitest";
import { computeStats, formatWatchTime } from "@/lib/stats";
import { makeItem } from "./fixtures";

describe("computeStats", () => {
  const items = [
    makeItem({
      mediaId: 1,
      status: "COMPLETED",
      progress: 12,
      score: 85,
      media: { duration: 24, genres: ["Action", "Drama"], format: "TV", seasonYear: 2019 },
    }),
    makeItem({
      mediaId: 2,
      status: "CURRENT",
      progress: 5,
      score: 70,
      media: { duration: 30, genres: ["Drama"], format: "TV_SHORT", seasonYear: 2023 },
    }),
    makeItem({
      mediaId: 3,
      status: "PLANNING",
      progress: 0,
      score: null,
      media: { genres: ["Horror"], format: "MOVIE", seasonYear: 1999 },
    }),
  ];
  const stats = computeStats(items);

  it("sums progress and watch time", () => {
    expect(stats.total).toBe(3);
    expect(stats.unitsDone).toBe(17);
    expect(stats.minutesWatched).toBe(12 * 24 + 5 * 30);
  });

  it("averages only rated entries and buckets scores", () => {
    expect(stats.meanScore).toBe(77.5);
    expect(stats.scoredCount).toBe(2);
    expect(stats.scoreBuckets[8]).toBe(1); // 85 -> 81-90
    expect(stats.scoreBuckets[6]).toBe(1); // 70 -> 61-70
  });

  it("excludes planned titles from genre, format and decade breakdowns", () => {
    expect(stats.genres.map((g) => [g.key, g.count])).toEqual([
      ["Drama", 2],
      ["Action", 1],
    ]);
    expect(stats.genres[0].meanScore).toBe(77.5);
    expect(stats.formats.map((f) => f.key)).toEqual(["TV", "TV SHORT"]);
    expect(stats.decades.map((d) => d.key)).toEqual(["2010s", "2020s"]);
  });

  it("handles an empty list", () => {
    const empty = computeStats([]);
    expect(empty.total).toBe(0);
    expect(empty.meanScore).toBeNull();
    expect(empty.genres).toEqual([]);
  });
});

describe("formatWatchTime", () => {
  it("formats minutes as days, hours and minutes", () => {
    expect(formatWatchTime(45)).toBe("45m");
    expect(formatWatchTime(125)).toBe("2h 5m");
    expect(formatWatchTime(1440 * 3 + 120)).toBe("3d 2h");
  });
});
