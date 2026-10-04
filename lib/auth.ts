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
  return process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID || "52733";
}

export function getAniListClientSecret(): string {
  return process.env.ANILIST_CLIENT_SECRET || "";
}

export async function getAniListToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("anilist_token")?.value ?? null;
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
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query: VIEWER_QUERY }),
      // Don't cache viewer profile statically
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.Viewer ?? null;
  } catch {
    return null;
  }
}
