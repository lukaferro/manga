import { NextResponse, type NextRequest } from "next/server";
import { getAniListToken } from "@/lib/auth";

const MEDIA_LIST_ENTRY_QUERY = `
  query ($mediaId: Int) {
    Media(id: $mediaId) {
      id
      mediaListEntry {
        id
        mediaId
        status
        score
        progress
      }
    }
  }
`;

const SAVE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation (
    $mediaId: Int,
    $status: MediaListStatus,
    $score: Float,
    $progress: Int
  ) {
    SaveMediaListEntry (
      mediaId: $mediaId,
      status: $status,
      score: $score,
      progress: $progress
    ) {
      id
      mediaId
      status
      score
      progress
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

export async function GET(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ entry: null, authenticated: false });
  }

  const mediaId = request.nextUrl.searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
  }

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: MEDIA_LIST_ENTRY_QUERY,
        variables: { mediaId: parseInt(mediaId, 10) },
      }),
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json({
      entry: json?.data?.Media?.mediaListEntry ?? null,
      authenticated: true,
    });
  } catch (err) {
    console.error("Error fetching media list entry:", err);
    return NextResponse.json({ error: "Failed to fetch list entry" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mediaId, status, score, progress } = body;

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: SAVE_MEDIA_LIST_ENTRY_MUTATION,
        variables: {
          mediaId: parseInt(mediaId, 10),
          status: status || undefined,
          score: score != null ? parseFloat(score) : undefined,
          progress: progress != null ? parseInt(progress, 10) : undefined,
        },
      }),
      cache: "no-store",
    });

    const json = await res.json();
    if (json.errors) {
      return NextResponse.json({ error: json.errors[0]?.message }, { status: 400 });
    }

    return NextResponse.json({
      entry: json?.data?.SaveMediaListEntry ?? null,
      success: true,
    });
  } catch (err) {
    console.error("Error saving media list entry:", err);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getAniListToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: DELETE_MEDIA_LIST_ENTRY_MUTATION,
        variables: { id: parseInt(id, 10) },
      }),
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json({
      deleted: json?.data?.DeleteMediaListEntry?.deleted ?? true,
      success: true,
    });
  } catch (err) {
    console.error("Error deleting media list entry:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
