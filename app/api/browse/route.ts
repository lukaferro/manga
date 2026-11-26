import { NextResponse, type NextRequest } from "next/server";
import { AniListError, fetchMediaList } from "@/lib/anilist";
import { parseBrowseParams, toMediaListParams } from "@/lib/browse-filters";
import { isValidEntityId } from "@/lib/entity-id";
import type { MediaCardData } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { filters, page } = parseBrowseParams((key) => request.nextUrl.searchParams.get(key));

  try {
    // Edge CDN caches responses via Cache-Control; bypass Next.js Data Cache to avoid ISR writes
    const data = await fetchMediaList(toMediaListParams(filters, page), { cache: "no-store" });
    // Only what MediaCard needs, to keep "load more" responses small
    const media: MediaCardData[] = data.Page.media
      .filter((m) => isValidEntityId(m?.id))
      .map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        coverImage: { large: m.coverImage.large, medium: m.coverImage.medium },
        averageScore: m.averageScore,
      }));
    return NextResponse.json(
      { media, page, hasNextPage: data.Page.pageInfo.hasNextPage },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    const status = err instanceof AniListError ? err.status : 500;
    return NextResponse.json({ error: "Failed to load more results" }, { status });
  }
}
