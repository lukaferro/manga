const MAX_ANILIST_ID = 2_147_483_647; // GraphQL 32-bit signed Int maximum
const POSITIVE_INT_RE = /^[1-9]\d*$/;
const VALID_ENTITY_HREF_RE = /^\/(media|character|staff)\/[1-9]\d*$/;

/**
 * Strictly validate an AniList entity ID (media, character, staff).
 * Rejects null, undefined, NaN, zero, negatives, floats, leading zeros,
 * and trailing characters like "123abc" that Number.parseInt accepts.
 */
export function parseEntityId(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_ANILIST_ID ? raw : null;
  }
  if (typeof raw === "string") {
    if (!POSITIVE_INT_RE.test(raw)) return null;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n > 0 && n <= MAX_ANILIST_ID ? n : null;
  }
  return null;
}

export function isValidEntityId(raw: unknown): raw is number {
  return parseEntityId(raw) !== null;
}

export function mediaHref(id: unknown): string | null {
  const valid = parseEntityId(id);
  return valid !== null ? `/media/${valid}` : null;
}

export function characterHref(id: unknown): string | null {
  const valid = parseEntityId(id);
  return valid !== null ? `/character/${valid}` : null;
}

export function staffHref(id: unknown): string | null {
  const valid = parseEntityId(id);
  return valid !== null ? `/staff/${valid}` : null;
}

export function isValidEntityHref(href: unknown): href is string {
  return typeof href === "string" && VALID_ENTITY_HREF_RE.test(href);
}
