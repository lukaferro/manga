import Image from "next/image";
import Link from "next/link";
import { AniListError, fetchMediaDetail } from "@/lib/anilist";
import { getMessages } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { FuzzyDate, Media } from "@/lib/types";
import MediaCard from "@/components/MediaCard";

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
    <p className="text-sm">
      <span className="font-medium">{label}:</span> {value}
    </p>
  );
}

export default async function MediaDetailPage({ params }: DetailPageProps) {
  const [{ id }, lang] = await Promise.all([params, getLang()]);
  const t = getMessages(lang);

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
        err instanceof AniListError ? err.message : "Errore durante il caricamento.";
    }
  }

  if (notFound || !media) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p>{errorMessage ?? t.notFound}</p>
        <Link href="/browse" className="border border-black/10 px-3 py-1 text-sm">
          {t.backToBrowse}
        </Link>
      </main>
    );
  }

  const mainTitle =
    media.title.romaji ?? media.title.english ?? media.title.native ?? "Untitled";

  return (
    <main className="flex flex-1 flex-col">
      {media.bannerImage ? (
        <div className="relative h-48 w-full">
          <Image
            src={media.bannerImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-6 px-4 py-6 md:flex-row">
        <div className="relative w-48 shrink-0">
          {media.coverImage.extraLarge ?? media.coverImage.large ? (
            <Image
              src={media.coverImage.extraLarge ?? media.coverImage.large ?? ""}
              alt={mainTitle}
              width={230}
              height={345}
              className="h-auto w-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{mainTitle}</h1>
          {media.title.english && media.title.english !== mainTitle ? (
            <h2 className="text-lg text-zinc-600">{media.title.english}</h2>
          ) : null}
          {media.title.native ? (
            <h2 className="text-lg text-zinc-600">{media.title.native}</h2>
          ) : null}

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="border border-black/10 px-2 py-0.5">{media.type}</span>
            {media.format ? (
              <span className="border border-black/10 px-2 py-0.5">{media.format}</span>
            ) : null}
            {media.status ? (
              <span className="border border-black/10 px-2 py-0.5">{media.status}</span>
            ) : null}
            {media.averageScore != null ? (
              <span className="border border-black/10 px-2 py-0.5">
                {t.score}: {media.averageScore}
              </span>
            ) : null}
          </div>

          {media.description ? (
            <div
              className="text-sm [&_a]:underline [&_br]:my-2"
              dangerouslySetInnerHTML={{ __html: media.description }}
            />
          ) : null}

          <div className="flex flex-col gap-1">
            {media.popularity != null ? (
              <DetailRow label={t.popularity} value={String(media.popularity)} />
            ) : null}
            {media.season && media.seasonYear ? (
              <DetailRow label={t.season} value={`${media.season} ${media.seasonYear}`} />
            ) : null}
            {media.startDate.year ? (
              <DetailRow label={t.details} value={formatDate(media.startDate)} />
            ) : null}
            {media.episodes != null ? (
              <DetailRow label={t.episodes} value={String(media.episodes)} />
            ) : null}
            {media.chapters != null ? (
              <DetailRow label={t.chapters} value={String(media.chapters)} />
            ) : null}
            {media.volumes != null ? (
              <DetailRow label={t.volumes} value={String(media.volumes)} />
            ) : null}
            {media.duration != null ? (
              <DetailRow label={t.duration} value={`${media.duration} min`} />
            ) : null}
            {media.source ? (
              <DetailRow label={t.source} value={media.source} />
            ) : null}
            {media.countryOfOrigin ? (
              <DetailRow label={t.country} value={media.countryOfOrigin} />
            ) : null}
            {media.studios?.nodes?.length ? (
              <DetailRow
                label="Studios"
                value={media.studios.nodes.map((s) => s.name).join(", ")}
              />
            ) : null}
          </div>

          {media.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-sm">
              {media.genres.map((g) => (
                <Link
                  key={g}
                  href={`/browse?genre=${encodeURIComponent(g)}`}
                  className="border border-black/10 px-2 py-0.5"
                >
                  {g}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {media.characters?.edges?.length ? (
        <section className="px-4 py-6">
          <h2 className="mb-3 text-xl font-semibold">{t.characters}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.characters.edges.map((edge) =>
              edge.node ? (
                <div key={edge.node.id} className="flex items-center gap-2 border border-black/10 p-2">
                  {edge.node.image?.large ? (
                    <Image
                      src={edge.node.image.large}
                      alt={edge.node.name.full ?? ""}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                    />
                  ) : null}
                  <div className="text-sm">
                    <p className="font-medium">{edge.node.name.full}</p>
                    <p className="text-xs text-zinc-500">{edge.role}</p>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {media.relations?.edges?.length ? (
        <section className="px-4 py-6">
          <h2 className="mb-3 text-xl font-semibold">{t.related}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
