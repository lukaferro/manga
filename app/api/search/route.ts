import { NextResponse, type NextRequest } from "next/server";
import { AniListError, fetchQuickSearch } from "@/lib/anilist";
import { isValidEntityId } from "@/lib/entity-id";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ media: [], characters: [], staff: [] });
  }

  try {
    const raw = await fetchQuickSearch(q.slice(0, 100));
    const results = {
      media: raw.media.filter((m) => isValidEntityId(m?.id)),
      characters: raw.characters.filter((c) => isValidEntityId(c?.id)),
      staff: raw.staff.filter((p) => isValidEntityId(p?.id)),
    };
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const status = err instanceof AniListError ? err.status : 500;
    return NextResponse.json({ error: "Search failed" }, { status });
  }
}
