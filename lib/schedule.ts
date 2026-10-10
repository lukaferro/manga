export interface DayBucket<T> {
  /** Local midnight of the day, in milliseconds */
  start: number;
  items: T[];
}

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addLocalDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/**
 * Split items into consecutive local days starting from the day that
 * contains `fromMs`. Uses calendar arithmetic so DST changes are handled.
 */
export function groupByLocalDay<T extends { airingAt: number }>(
  items: T[],
  fromMs: number,
  days = 7,
): DayBucket<T>[] {
  const first = startOfLocalDay(fromMs);
  const buckets: DayBucket<T>[] = Array.from({ length: days }, (_, i) => ({
    start: addLocalDays(first, i),
    items: [],
  }));
  const end = addLocalDays(first, days);

  for (const item of items) {
    const ms = item.airingAt * 1000;
    if (ms < first || ms >= end) continue;
    // Walk back from the last bucket; days are few so this stays cheap
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (ms >= buckets[i].start) {
        buckets[i].items.push(item);
        break;
      }
    }
  }

  for (const bucket of buckets) bucket.items.sort((a, b) => a.airingAt - b.airingAt);
  return buckets;
}
