import Image from "next/image";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";
import { AniListError, fetchMediaDetail } from "@/lib/anilist";
import type { FuzzyDate, Media } from "@/lib/types";
import styles from "./detail.module.css";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: FuzzyDate): string {
  if (!date.year) return "—";
  const month = date.month ? String(date.month).padStart(2, "0") : "??";
  const day = date.day ? String(date.day).padStart(2, "0") : "??";
  return `${date.year}-${month}-${day}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}:</span> {value}
    </p>
  );
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
        <Link href="/browse" className={styles.button}>
          Back to Browse
        </Link>
      </main>
    );
  }

  const mainTitle =
    media.title.romaji ?? media.title.english ?? media.title.native ?? "Untitled";

  return (
    <main className="flex flex-1 flex-col">
      {media.bannerImage ? (
        <div className={styles.banner}>
          <Image
            src={media.bannerImage}
            alt=""
            fill
            sizes="100vw"
            className={styles.bannerImage}
          />
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.coverWrap}>
          {media.coverImage.extraLarge ?? media.coverImage.large ? (
            <Image
              src={media.coverImage.extraLarge ?? media.coverImage.large ?? ""}
              alt={mainTitle}
              width={230}
              height={345}
              className={styles.coverImage}
            />
          ) : null}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{mainTitle}</h1>
          {media.title.english && media.title.english !== mainTitle ? (
            <h2 className={styles.subtitle}>{media.title.english}</h2>
          ) : null}
          {media.title.native ? (
            <h2 className={styles.subtitle}>{media.title.native}</h2>
          ) : null}

          <div className={styles.badgeRow}>
            <span className={styles.badge}>{media.type}</span>
            {media.format ? (
              <span className={styles.badge}>{media.format}</span>
            ) : null}
            {media.status ? (
              <span className={styles.badge}>{media.status}</span>
            ) : null}
            {media.averageScore != null ? (
              <span className={styles.badge}>
                Score: {media.averageScore}
              </span>
            ) : null}
          </div>

          {media.description ? (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: media.description }}
            />
          ) : null}

          <div className={styles.details}>
            {media.popularity != null ? (
              <DetailRow label="Popularity" value={String(media.popularity)} />
            ) : null}
            {media.season && media.seasonYear ? (
              <DetailRow label="Season" value={`${media.season} ${media.seasonYear}`} />
            ) : null}
            {media.startDate.year ? (
              <DetailRow label="Details" value={formatDate(media.startDate)} />
            ) : null}
            {media.episodes != null ? (
              <DetailRow label="Episodes" value={String(media.episodes)} />
            ) : null}
            {media.chapters != null ? (
              <DetailRow label="Chapters" value={String(media.chapters)} />
            ) : null}
            {media.volumes != null ? (
              <DetailRow label="Volumes" value={String(media.volumes)} />
            ) : null}
            {media.duration != null ? (
              <DetailRow label="Duration" value={`${media.duration} min`} />
            ) : null}
            {media.source ? (
              <DetailRow label="Source" value={media.source} />
            ) : null}
            {media.countryOfOrigin ? (
              <DetailRow label="Country" value={media.countryOfOrigin} />
            ) : null}
            {media.studios?.nodes?.length ? (
              <DetailRow
                label="Studios"
                value={media.studios.nodes.map((s) => s.name).join(", ")}
              />
            ) : null}
          </div>

          {media.genres.length > 0 ? (
            <div className={styles.badgeRow}>
              {media.genres.map((g) => (
                <Link
                  key={g}
                  href={`/browse?genre=${encodeURIComponent(g)}`}
                  className={styles.badge}
                >
                  {g}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {media.characters?.edges?.length ? (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Characters</h2>
          <div className={styles.charGrid}>
            {media.characters.edges.map((edge) =>
              edge.node ? (
                <div key={edge.node.id} className={styles.charCard}>
                  {edge.node.image?.large ? (
                    <Image
                      src={edge.node.image.large}
                      alt={edge.node.name.full ?? ""}
                      width={64}
                      height={64}
                      className={styles.charImage}
                    />
                  ) : null}
                  <div className={styles.charInfo}>
                    <p className={styles.charName}>{edge.node.name.full}</p>
                    <p className={styles.charRole}>{edge.role}</p>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {media.relations?.edges?.length ? (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Related Media</h2>
          <div className={styles.relGrid}>
            {media.relations.edges.map((edge, i) =>
              edge.node ? (
                <MediaCard key={`${edge.node.id}-${i}`} media={edge.node} />
              ) : null,
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
