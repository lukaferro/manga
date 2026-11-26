import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaRoleItem from "@/components/people/MediaRoleItem";
import PersonLayout, { formatFuzzyDate, type Fact } from "@/components/people/PersonLayout";
import { AniListError, fetchCharacter } from "@/lib/anilist";
import { isValidEntityId, parseEntityId, staffHref } from "@/lib/entity-id";
import type { Character } from "@/lib/types";
import detail from "@/app/media/[id]/detail.module.css";
import styles from "@/components/people/People.module.css";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

// Conservative 30-day ISR cache: character biographies change rarely
export const revalidate = 2592000;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

async function loadCharacter(rawId: string): Promise<Character | null> {
  const id = parseEntityId(rawId);
  if (id === null) return null;
  try {
    return await fetchCharacter(id);
  } catch (err) {
    if (err instanceof AniListError && err.status === 404) return null;
    throw err;
  }
}

function plainText(html: string | null, max = 160): string | undefined {
  return html ? html.replace(/<[^>]*>?/gm, "").slice(0, max) : undefined;
}

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const { id } = await params;
  if (parseEntityId(id) === null) {
    return { title: "Character Not Found", robots: { index: false, follow: false } };
  }
  const character = await loadCharacter(id).catch(() => null);
  if (!character) {
    return { title: "Character | Manga & Anime", robots: { index: false, follow: false } };
  }
  const name = character.name.full ?? "Character";
  return {
    title: `${name} | Manga & Anime`,
    description: plainText(character.description),
    openGraph: {
      title: name,
      images: character.image?.large ? [character.image.large] : [],
    },
  };
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { id } = await params;
  if (parseEntityId(id) === null) notFound();

  const character = await loadCharacter(id);
  if (!character) notFound();

  const name = character.name.full ?? "Unknown";
  const facts = (
    [
      { label: "Gender", value: character.gender },
      { label: "Age", value: character.age },
      { label: "Birthday", value: formatFuzzyDate(character.dateOfBirth) },
      { label: "Blood type", value: character.bloodType },
    ] as Fact[]
  ).filter((f) => Boolean(f.value));

  const appearances = (character.media?.edges ?? []).filter(
    (e) => Boolean(e.node && isValidEntityId(e.node.id)),
  );

  return (
    <PersonLayout
      name={name}
      nativeName={character.name.native}
      alternativeNames={character.name.alternative?.filter(Boolean)}
      image={character.image?.large ?? null}
      description={character.description}
      facts={facts}
      siteUrl={character.siteUrl}
      favourites={character.favourites}
    >
      {appearances.length > 0 && (
        <section className={styles.section}>
          <h2 className={detail.sectionTitle}>Appearances</h2>
          <ul className={styles.mediaGrid}>
            {appearances.map((edge) => {
              const va = edge.voiceActors?.[0];
              const vaUrl = va ? staffHref(va.id) : null;
              return (
                <MediaRoleItem
                  key={edge.node!.id}
                  media={edge.node!}
                  role={edge.characterRole}
                  person={vaUrl ? va : undefined}
                  personHref={vaUrl ?? undefined}
                />
              );
            })}
          </ul>
        </section>
      )}
    </PersonLayout>
  );
}
