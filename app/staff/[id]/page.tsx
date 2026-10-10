import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaRoleItem from "@/components/people/MediaRoleItem";
import PersonLayout, { formatFuzzyDate, type Fact } from "@/components/people/PersonLayout";
import { AniListError, fetchStaff } from "@/lib/anilist";
import type { Staff } from "@/lib/types";
import detail from "@/app/media/[id]/detail.module.css";
import styles from "@/components/people/People.module.css";

interface StaffPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

async function loadStaff(rawId: string): Promise<Staff | null> {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    return await fetchStaff(id);
  } catch (err) {
    if (err instanceof AniListError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: StaffPageProps): Promise<Metadata> {
  const { id } = await params;
  const staff = await loadStaff(id).catch(() => null);
  if (!staff) return { title: "Staff | Manga & Anime" };
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

  const roles = (staff.characterMedia?.edges ?? []).filter((e) => e.node);
  const production = (staff.staffMedia?.edges ?? []).filter((e) => e.node);

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
              return (
                <MediaRoleItem
                  key={`${edge.node!.id}-${character?.id ?? i}`}
                  media={edge.node!}
                  role={edge.characterRole}
                  person={character}
                  personHref={character ? `/character/${character.id}` : undefined}
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
