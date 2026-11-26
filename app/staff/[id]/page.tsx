import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaRoleItem from "@/components/people/MediaRoleItem";
import PersonLayout, { formatFuzzyDate, type Fact } from "@/components/people/PersonLayout";
import { AniListError, fetchStaff } from "@/lib/anilist";
import { characterHref, isValidEntityId, parseEntityId } from "@/lib/entity-id";
import type { Staff } from "@/lib/types";
import detail from "@/app/media/[id]/detail.module.css";
import styles from "@/components/people/People.module.css";

interface StaffPageProps {
  params: Promise<{ id: string }>;
}

// Conservative 30-day ISR cache: staff profiles change rarely
export const revalidate = 2592000;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

async function loadStaff(rawId: string): Promise<Staff | null> {
  const id = parseEntityId(rawId);
  if (id === null) return null;
  try {
    return await fetchStaff(id);
  } catch (err) {
    if (err instanceof AniListError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: StaffPageProps): Promise<Metadata> {
  const { id } = await params;
  if (parseEntityId(id) === null) {
    return { title: "Staff Not Found", robots: { index: false, follow: false } };
  }
  const staff = await loadStaff(id).catch(() => null);
  if (!staff) {
    return { title: "Staff | Manga & Anime", robots: { index: false, follow: false } };
  }
  const name = staff.name.full ?? "Staff";
  return {
    title: `${name} | Manga & Anime`,
    description: staff.description?.replace(/<[^>]*>?/gm, "").slice(0, 160),
    openGraph: {
      title: name,
      images: staff.image?.large ? [staff.image.large] : [],
    },
  };
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { id } = await params;
  if (parseEntityId(id) === null) notFound();

  const staff = await loadStaff(id);
  if (!staff) notFound();

  const name = staff.name.full ?? "Unknown";
  const [activeFrom, activeTo] = staff.yearsActive ?? [];
  const facts = (
    [
      { label: "Occupation", value: staff.primaryOccupations?.join(", ") },
      { label: "Language", value: staff.language },
      { label: "Gender", value: staff.gender },
      { label: "Birthday", value: formatFuzzyDate(staff.dateOfBirth) },
      { label: "Died", value: formatFuzzyDate(staff.dateOfDeath) },
      { label: "Age", value: staff.age },
      { label: "Hometown", value: staff.homeTown },
      {
        label: "Active",
        value: activeFrom ? `${activeFrom}–${activeTo ?? "present"}` : null,
      },
    ] as Fact[]
  ).filter((f) => f.value != null && f.value !== "");

  const roles = (staff.characterMedia?.edges ?? []).filter(
    (e) => Boolean(e.node && isValidEntityId(e.node.id)),
  );
  const production = (staff.staffMedia?.edges ?? []).filter(
    (e) => Boolean(e.node && isValidEntityId(e.node.id)),
  );

  return (
    <PersonLayout
      name={name}
      nativeName={staff.name.native}
      alternativeNames={staff.name.alternative?.filter(Boolean)}
      image={staff.image?.large ?? null}
      description={staff.description}
      facts={facts}
      siteUrl={staff.siteUrl}
      favourites={staff.favourites}
    >
      {roles.length > 0 && (
        <section className={styles.section}>
          <h2 className={detail.sectionTitle}>Character Roles</h2>
          <ul className={styles.mediaGrid}>
            {roles.map((edge, i) => {
              const character = edge.characters?.[0];
              const charUrl = character ? characterHref(character.id) : null;
              return (
                <MediaRoleItem
                  key={`${edge.node!.id}-${character?.id ?? i}`}
                  media={edge.node!}
                  role={edge.characterRole}
                  person={charUrl ? character : undefined}
                  personHref={charUrl ?? undefined}
                />
              );
            })}
          </ul>
        </section>
      )}

      {production.length > 0 && (
        <section className={styles.section}>
          <h2 className={detail.sectionTitle}>Staff Roles</h2>
          <ul className={styles.mediaGrid}>
            {production.map((edge, i) => (
              <MediaRoleItem
                key={`${edge.node!.id}-${i}`}
                media={edge.node!}
                role={edge.staffRole}
              />
            ))}
          </ul>
        </section>
      )}
    </PersonLayout>
  );
}
