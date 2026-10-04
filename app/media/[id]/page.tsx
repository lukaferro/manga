import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";
import TrailerModal from "@/components/TrailerModal";
import { AniListError, fetchMediaDetail } from "@/lib/anilist";
import type { FuzzyDate, Media } from "@/lib/types";
import styles from "./detail.module.css";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetchMediaDetail(parseInt(id, 10));
    const media = res.Media;
    if (!media) return { title: "Media Not Found" };
    const title = media.title.romaji || media.title.english || "Media Detail";
    const plainDesc = media.description
      ? media.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
      : "Discover anime and manga on Manga & Anime.";
    return {
      title: `${title} | Manga & Anime`,
      description: plainDesc,
      openGraph: {
        title,
        description: plainDesc,
        images: media.coverImage.extraLarge ? [media.coverImage.extraLarge] : [],
      },
    };
  } catch {
    return { title: "Media Detail | Manga & Anime" };
  }
}

function formatDate(date: FuzzyDate): string {
  if (!date.year) return "—";
  const month = date.month ? String(date.month).padStart(2, "0") : "??";
  const day = date.day ? String(date.day).padStart(2, "0") : "??";
  return `${date.year}-${month}-${day}`;
}

function formatTimeUntil(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatRelationLabel(type: string | null): string {
  if (!type) return "Related";
  return type.replace(/_/g, " ");
}

export default async function MediaDetailPage({ params }: DetailPageProps) {
  const { id } = await params;

  let media: Media | null = null;
  let notFound = false;
  let errorMessage: string | null = null;

  try {
    const res = await fetchMediaDetail(parseInt(id, 10));
    media = res.Media;
  } catch (err) {
    if (err instanceof AniListError && err.status === 404) {
      notFound = true;
    } else {
      errorMessage =
        err instanceof AniListError ? err.message : "Error loading content.";
    }
  }

  if (notFound || !media) {
    return (
      <main className={styles.notFound}>
        <p>{errorMessage ?? "Media not found."}</p>
        <Link href="/browse" className={styles.backButton}>
          ← Back to Browse
        </Link>
      </main>
    );
  }

  const mainTitle =
    media.title.romaji ?? media.title.english ?? media.title.native ?? "Untitled";

  const recommendations = (media.recommendations?.nodes ?? [])
    .map((node) => node.mediaRecommendation)
    .filter(Boolean);

  return (
    <main className={styles.page}>
      {/* Cinematic Banner */}
      <div className={styles.bannerWrap}>
        {media.bannerImage ? (
          <Image
            src={media.bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.bannerImage}
          />
        ) : null}
        <div className={styles.bannerOverlay} />
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Left Column: Cover, Trailer, Metadata & Links */}
          <aside className={styles.sidebar}>
            <div className={styles.coverWrap}>
              {media.coverImage.extraLarge ?? media.coverImage.large ? (
                <Image
                  src={
                    media.coverImage.extraLarge ??
                    media.coverImage.large ??
                    ""
                  }
                  alt={mainTitle}
                  fill
                  priority
                  sizes="(max-width: 768px) 260px, 280px"
                  className={styles.coverImage}
                />
              ) : null}

              {media.averageScore != null && (
                <div className={styles.scoreBadge}>
                  <span>★</span>
                  <span>{media.averageScore}%</span>
                </div>
              )}
            </div>

            {/* Trailer Modal Button */}
            <TrailerModal trailer={media.trailer} title={mainTitle} />

            {/* Information Card */}
            <div className={styles.metaCard}>
              <span className={styles.metaTitle}>Information</span>

              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Type</span>
                <span className={styles.metaValue}>{media.type}</span>
              </div>

              {media.format && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Format</span>
                  <span className={styles.metaValue}>
                    {media.format.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {media.status && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Status</span>
                  <span className={styles.metaValue}>
                    {media.status.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {media.episodes != null && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Episodes</span>
                  <span className={styles.metaValue}>{media.episodes}</span>
                </div>
              )}

              {media.duration != null && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Duration</span>
                  <span className={styles.metaValue}>{media.duration} mins</span>
                </div>
              )}

              {media.chapters != null && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Chapters</span>
                  <span className={styles.metaValue}>{media.chapters}</span>
                </div>
              )}

              {media.volumes != null && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Volumes</span>
                  <span className={styles.metaValue}>{media.volumes}</span>
                </div>
              )}

              {media.season && media.seasonYear ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Season</span>
                  <span className={styles.metaValue}>
                    {media.season} {media.seasonYear}
                  </span>
                </div>
              ) : null}

              {media.startDate.year ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Aired</span>
                  <span className={styles.metaValue}>
                    {formatDate(media.startDate)}
                  </span>
                </div>
              ) : null}

              {media.studios?.nodes?.length ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Studio</span>
                  <span className={styles.metaValue}>
                    {media.studios.nodes.map((s) => s.name).join(", ")}
                  </span>
                </div>
              ) : null}

              {media.source && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Source</span>
                  <span className={styles.metaValue}>
                    {media.source.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>

            {/* External Links */}
            {media.externalLinks && media.externalLinks.length > 0 && (
              <div className={styles.linksCard}>
                <span className={styles.metaTitle}>Official Links</span>
                <div className={styles.linksList}>
                  {media.externalLinks.slice(0, 6).map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.extLink}
                    >
                      {link.site}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Main Column: Titles, Synopsis, Cast, Relations & Recommendations */}
          <div className={styles.mainCol}>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>{mainTitle}</h1>
              <div className={styles.subtitles}>
                {media.title.english && media.title.english !== mainTitle ? (
                  <span className={styles.englishTitle}>
                    {media.title.english}
                  </span>
                ) : null}
                {media.title.native ? (
                  <span className={styles.nativeTitle}>
                    {media.title.native}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Airing episode notification */}
            {media.nextAiringEpisode && (
              <div className={styles.airingAlert}>
                <span className={styles.pulseDot} />
                <span>
                  Episode {media.nextAiringEpisode.episode} airs in{" "}
                  {formatTimeUntil(media.nextAiringEpisode.timeUntilAiring)}
                </span>
              </div>
            )}

            {/* Genres */}
            {media.genres.length > 0 && (
              <div className={styles.genres}>
                {media.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/browse?genre=${encodeURIComponent(g)}`}
                    className={styles.genreTag}
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {media.description && (
              <section className={styles.synopsisSection}>
                <h2 className={styles.sectionTitle}>Synopsis</h2>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: media.description }}
                />
              </section>
            )}

            {/* Characters & Voice Actors */}
            {media.characters?.edges?.length ? (
              <section className={styles.charSection}>
                <h2 className={styles.sectionTitle}>Characters & Cast</h2>
                <div className={styles.charGrid}>
                  {media.characters.edges.map((edge) => {
                    if (!edge.node) return null;
                    const char = edge.node;
                    const va = edge.voiceActors?.[0];

                    return (
                      <div key={char.id} className={styles.charCard}>
                        {/* Character info */}
                        <div className={styles.charSide}>
                          {char.image?.large ? (
                            <Image
                              src={char.image.large}
                              alt={char.name?.full ?? "Character"}
                              width={58}
                              height={72}
                              className={styles.charThumb}
                            />
                          ) : null}
                          <div className={styles.charTexts}>
                            <p className={styles.charName}>
                              {char.name?.full ?? "Unknown"}
                            </p>
                            <p className={styles.charRole}>
                              {edge.role?.toLowerCase() ?? "Character"}
                            </p>
                          </div>
                        </div>

                        {/* Japanese Voice Actor info if available */}
                        {va ? (
                          <div className={styles.vaSide}>
                            <div className={styles.vaTexts}>
                              <p className={styles.vaName}>
                                {va.name?.full ?? "Voice Actor"}
                              </p>
                              <p className={styles.vaRole}>Japanese</p>
                            </div>
                            {va.image?.medium ?? va.image?.large ? (
                              <Image
                                src={
                                  va.image.medium ?? va.image.large ?? ""
                                }
                                alt={va.name?.full ?? "Voice Actor"}
                                width={58}
                                height={72}
                                className={styles.charThumb}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Related Media */}
            {media.relations?.edges?.length ? (
              <section className={styles.relationsSection}>
                <h2 className={styles.sectionTitle}>Related Media</h2>
                <div className={styles.relationGrid}>
                  {media.relations.edges.map((edge, i) =>
                    edge.node ? (
                      <div
                        key={`${edge.node.id}-${i}`}
                        className={styles.relationCardWrap}
                      >
                        <span className={styles.relationBadge}>
                          {formatRelationLabel(edge.relationType)}
                        </span>
                        <MediaCard media={edge.node} />
                      </div>
                    ) : null,
                  )}
                </div>
              </section>
            ) : null}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section className={styles.recsSection}>
                <h2 className={styles.sectionTitle}>You Might Also Like</h2>
                <div className={styles.recsGrid}>
                  {recommendations.map((rec) =>
                    rec ? <MediaCard key={rec.id} media={rec} /> : null,
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
