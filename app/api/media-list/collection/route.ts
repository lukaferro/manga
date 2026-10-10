import { NextResponse, type NextRequest } from "next/server";
import { AniListAuthError, anilistAuthFetch, getAniListToken, getViewer } from "@/lib/auth";
import type { ListItem, MediaType } from "@/lib/types";

const COLLECTION_QUERY = `
  query ($userId: Int, $type: MediaType) {
    MediaListCollection(userId: $userId, type: $type, forceSingleCompletedList: true) {
      lists {
        isCustomList
        entries {
          id
          mediaId
          status
          score(format: POINT_100)
          progress
          updatedAt
          media {
            id
            type
            format
            status
            episodes
            chapters
            duration
            genres
            averageScore
            seasonYear
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
              color
            }
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      }
    }
  }
`;

interface CollectionResponse {
  MediaListCollection: {
    lists: { isCustomList: boolean; entries: ListItem[] }[];
  } | null;
}

export async function GET(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  const type: MediaType = typeParam === "MANGA" ? "MANGA" : "ANIME";

  const viewer = await getViewer(token);
  if (!viewer) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const data = await anilistAuthFetch<CollectionResponse>(token, COLLECTION_QUERY, {
      userId: viewer.id,
      type,
    });

    // Custom lists repeat entries that already live in a status list
    const seen = new Set<number>();
    const items: ListItem[] = [];
    for (const list of data.MediaListCollection?.lists ?? []) {
      if (list.isCustomList) continue;
      for (const entry of list.entries) {
        if (seen.has(entry.mediaId)) continue;
        seen.add(entry.mediaId);
        items.push(entry);
      }
    }

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof AniListAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to fetch list collection:", err);
    return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 });
  }
}
