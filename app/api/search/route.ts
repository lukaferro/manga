import { NextResponse, type NextRequest } from "next/server";
import { AniListError, fetchQuickSearch } from "@/lib/anilist";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ media: [], characters: [], staff: [] });
  }

  try {
    const results = await fetchQuickSearch(q.slice(0, 100));
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=600" },
    });
  } catch (err) {
    const status = err instanceof AniListError ? err.status : 500;
    return NextResponse.json({ error: "Search failed" }, { status });
  }
}
