import { ImageResponse } from "next/og";
import { AniListError, fetchMediaDetail } from "@/lib/anilist";

export const alt = "Anime or manga cover, title and score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

const FALLBACK_COLOR = "#d63a5a";

/** Inline the cover as a data URI; returns null if it can't be fetched. */
async function loadCover(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!/^image\/(jpeg|png)/.test(type)) return null;
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${base64}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await fetchMediaDetail(Number.parseInt(id, 10))
    .then((res) => res.Media)
    .catch((err) => {
      // Unknown id: generic card. Anything else: fail, so no fallback gets cached
      if (err instanceof AniListError && err.status === 404) return null;
      throw err;
    });

  // The default font has Latin glyphs only, so prefer romanised titles
  const title = media
    ? media.title.english || media.title.romaji || "Untitled"
    : "Manga & Anime";
  const color = media?.coverImage.color || FALLBACK_COLOR;
  const cover = await loadCover(media?.coverImage.large || media?.coverImage.extraLarge);
  const details = media
    ? [
        media.type === "ANIME" ? "Anime" : "Manga",
        media.format?.replace(/_/g, " "),
        media.seasonYear ?? media.startDate.year,
        media.episodes ? `${media.episodes} episodes` : null,
        media.chapters ? `${media.chapters} chapters` : null,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : "Browse anime and manga powered by AniList";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 64,
          background: `linear-gradient(135deg, #0d0b0c 0%, #0d0b0c 45%, ${color} 160%)`,
          color: "#f3edea",
          fontFamily: "sans-serif",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain img
          <img
            src={cover}
            alt=""
            width={330}
            height={470}
            style={{
              borderRadius: 24,
              objectFit: "cover",
              boxShadow: `0 20px 60px ${color}66`,
            }}
          />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24 }}>
          <div style={{ fontSize: 26, color: "#e8536f", fontWeight: 700, letterSpacing: 2 }}>
            MANGA & ANIME
          </div>
          <div
            style={{
              fontSize: title.length > 40 ? 52 : 68,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#a8a09a" }}>{details}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            {media?.averageScore != null && (
              <div
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "#e8536f",
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 700,
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* SVG star: the default OG font has no glyph for ★ */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                </svg>
                {media.averageScore}%
              </div>
            )}
            {(media?.genres ?? []).slice(0, 3).map((genre) => (
              <div
                key={genre}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: "2px solid #ffffff33",
                  fontSize: 26,
                }}
              >
                {genre}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
