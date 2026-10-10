import { describe, expect, it } from "vitest";
import { groupByLocalDay, startOfLocalDay } from "@/lib/schedule";
import { formatShortCountdown } from "@/lib/time";

describe("groupByLocalDay", () => {
  // Midday on a fixed local date, so the test is timezone independent
  const base = new Date(2026, 9, 10, 12, 0, 0).getTime();
  const at = (dayOffset: number, hour: number) =>
    Math.floor(new Date(2026, 9, 10 + dayOffset, hour, 30).getTime() / 1000);

  it("buckets items into consecutive local days, sorted by time", () => {
    const items = [
      { id: "b", airingAt: at(0, 22) },
      { id: "a", airingAt: at(0, 1) },
      { id: "c", airingAt: at(1, 0) },
      { id: "d", airingAt: at(6, 23) },
    ];
    const days = groupByLocalDay(items, base, 7);
    expect(days).toHaveLength(7);
    expect(days[0].start).toBe(startOfLocalDay(base));
    expect(days[0].items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(days[1].items.map((i) => i.id)).toEqual(["c"]);
    expect(days[6].items.map((i) => i.id)).toEqual(["d"]);
  });

  it("ignores items outside the window", () => {
    const days = groupByLocalDay([{ airingAt: at(-1, 23) }, { airingAt: at(7, 0) }], base, 7);
    expect(days.every((d) => d.items.length === 0)).toBe(true);
  });
});

describe("formatShortCountdown", () => {
  it.each([
    [0, "now"],
    [30, "1m"],
    [45 * 60, "45m"],
    [3 * 3600, "3h"],
    [3 * 3600 + 20 * 60, "3h 20m"],
    [2 * 86400 + 4 * 3600, "2d 4h"],
    [5 * 86400, "5d"],
  ])("%i seconds -> %s", (seconds, expected) => {
    expect(formatShortCountdown(seconds)).toBe(expected);
  });
});
