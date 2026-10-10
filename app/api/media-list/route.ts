import { NextResponse, type NextRequest } from "next/server";
import { AniListAuthError, anilistAuthFetch, getAniListToken } from "@/lib/auth";
import type { MediaListEntry } from "@/lib/types";

// Scores are always exchanged on a 0-100 scale, independent of the
// user's AniList score format setting.
const ENTRY_FIELDS = `
  id
  mediaId
  status
  score(format: POINT_100)
  progress
  updatedAt
`;

const MEDIA_LIST_ENTRY_QUERY = `
  query ($mediaId: Int) {
    Media(id: $mediaId) {
      id
      mediaListEntry {
        ${ENTRY_FIELDS}
      }
    }
  }
`;

const SAVE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation (
    $mediaId: Int,
    $status: MediaListStatus,
    $scoreRaw: Int,
    $progress: Int
  ) {
    SaveMediaListEntry (
      mediaId: $mediaId,
      status: $status,
      scoreRaw: $scoreRaw,
      progress: $progress
    ) {
      ${ENTRY_FIELDS}
    }
  }
`;

const DELETE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation ($id: Int) {
    DeleteMediaListEntry (id: $id) {
      deleted
    }
  }
`;

function toInt(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : undefined;
}

function errorResponse(err: unknown, fallback: string) {
  if (err instanceof AniListAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(fallback, err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ entry: null, authenticated: false });
  }

  const mediaId = toInt(request.nextUrl.searchParams.get("mediaId"));
  if (!mediaId) {
    return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
  }

  try {
    const data = await anilistAuthFetch<{
      Media: { mediaListEntry: MediaListEntry | null } | null;
    }>(token, MEDIA_LIST_ENTRY_QUERY, { mediaId });

    return NextResponse.json({
      entry: data.Media?.mediaListEntry ?? null,
      authenticated: true,
    });
  } catch (err) {
    return errorResponse(err, "Failed to fetch list entry");
  }
}

export async function POST(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mediaId = toInt(body.mediaId);
    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    const score = toInt(body.score);
    const progress = toInt(body.progress);

    const data = await anilistAuthFetch<{ SaveMediaListEntry: MediaListEntry }>(
      token,
      SAVE_MEDIA_LIST_ENTRY_MUTATION,
      {
        mediaId,
        status: body.status || undefined,
        scoreRaw: score != null ? Math.min(100, Math.max(0, score)) : undefined,
        progress: progress != null ? Math.max(0, progress) : undefined,
      },
    );

    return NextResponse.json({ entry: data.SaveMediaListEntry, success: true });
  } catch (err) {
    return errorResponse(err, "Failed to save entry");
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = toInt(body.id);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const data = await anilistAuthFetch<{ DeleteMediaListEntry: { deleted: boolean } }>(
      token,
      DELETE_MEDIA_LIST_ENTRY_MUTATION,
      { id },
    );

    const deleted = Boolean(data.DeleteMediaListEntry?.deleted);
    return NextResponse.json(
      { deleted, success: deleted },
      { status: deleted ? 200 : 400 },
    );
  } catch (err) {
    return errorResponse(err, "Failed to delete entry");
  }
}
