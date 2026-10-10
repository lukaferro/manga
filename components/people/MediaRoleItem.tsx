import Image from "next/image";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";
import type { MediaThumb, PersonRef } from "@/lib/types";
import styles from "./People.module.css";

interface MediaRoleItemProps {
  media: MediaThumb;
  role: string | null;
  /** Linked person shown under the card (voice actor or voiced character) */
  person?: PersonRef | null;
  personHref?: string;
}

export default function MediaRoleItem({ media, role, person, personHref }: MediaRoleItemProps) {
  return (
    <li className={styles.mediaItem}>
      <MediaCard media={media} />
      {role ? <span className={styles.role}>{role.replace(/_/g, " ").toLowerCase()}</span> : null}
      {person && personHref ? (
        <Link href={personHref} className={styles.person}>
          {person.image?.medium ? (
            <Image
              src={person.image.medium}
              alt=""
              width={28}
              height={28}
              className={styles.personThumb}
            />
          ) : (
            <span className={styles.personThumb} aria-hidden="true" />
          )}
          <span className={styles.personName}>{person.name.full ?? "Unknown"}</span>
        </Link>
      ) : null}
    </li>
  );
}
