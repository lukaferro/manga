import { cookies } from "next/headers";

export interface AniListUser {
  id: number;
  name: string;
  avatar: {
    large: string | null;
    medium: string | null;
  } | null;
  bannerImage: string | null;
}

export const TOKEN_COOKIE = "anilist_token";
export const RETURN_TO_COOKIE = "auth_return_to";
export const STATE_COOKIE = "auth_state";

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getAniListClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_ANILIST_CLIENT_ID is not configured");
  }
  return clientId;
}

export function getAniListClientSecret(): string {
  return process.env.ANILIST_CLIENT_SECRET || "";
}

/**
 * Only allow same-origin relative paths as post-auth redirect targets,
 * so `returnTo` can't be abused as an open redirect.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  return value;
}

export async function getAniListToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

export class AniListAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AniListAuthError";
    this.status = status;
  }
}

/** GraphQL request to AniList on behalf of the logged-in user. */
export async function anilistAuthFetch<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.errors?.length) {
    const message = json?.errors?.[0]?.message ?? `AniList error ${res.status}`;
    throw new AniListAuthError(message, res.ok ? 400 : res.status);
  }

  return json.data as T;
}

const VIEWER_QUERY = `
  query {
    Viewer {
      id
      name
      avatar {
        large
        medium
      }
      bannerImage
    }
  }
`;

export async function getViewer(token?: string | null): Promise<AniListUser | null> {
  const authToken = token ?? (await getAniListToken());
  if (!authToken) return null;

  try {
    const data = await anilistAuthFetch<{ Viewer: AniListUser | null }>(
      authToken,
      VIEWER_QUERY,
    );
    return data.Viewer;
  } catch {
    return null;
  }
}
