import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaRoleItem from "@/components/people/MediaRoleItem";
import PersonLayout, { formatFuzzyDate, type Fact } from "@/components/people/PersonLayout";
import { AniListError, fetchCharacter } from "@/lib/anilist";
import type { Character } from "@/lib/types";
import detail from "@/app/media/[id]/detail.module.css";
import styles from "@/components/people/People.module.css";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

async function loadCharacter(rawId: string): Promise<Character | null> {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
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
  const character = await loadCharacter(id).catch(() => null);
  if (!character) return { title: "Character | Manga & Anime" };
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

  const appearances = (character.media?.edges ?? []).filter((e) => e.node);

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
              return (
                <MediaRoleItem
                  key={edge.node!.id}
                  media={edge.node!}
                  role={edge.characterRole}
                  person={va}
                  personHref={va ? `/staff/${va.id}` : undefined}
                />
              );
            })}
          </ul>
        </section>
      )}
    </PersonLayout>
  );
}
