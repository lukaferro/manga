import Image from "next/image";
import Link from "next/link";
import { mediaHref } from "@/lib/entity-id";
import type { MediaCardData } from "@/lib/types";
import styles from "./MediaCard.module.css";

interface MediaCardProps {
  media: MediaCardData;
}

export function mediaTitle(media: MediaCardData): string {
  return media.title.romaji || media.title.english || media.title.native || "Untitled";
}

export default function MediaCard({ media }: MediaCardProps) {
  const href = mediaHref(media?.id);
  if (!href) return null;

  const src = media.coverImage.large ?? media.coverImage.medium ?? "";

  return (
    <Link href={href} prefetch={false} className={styles.card}>
      <div className={styles.cover}>
        {src ? (
          <Image
            src={src}
            alt={mediaTitle(media)}
            fill
            sizes="(max-width: 640px) 40vw, 160px"
            className={styles.image}
          />
        ) : null}
        <div className={styles.overlay}>
          <p className={styles.title}>{mediaTitle(media)}</p>
          <p className={styles.meta}>
            {media.type} {media.averageScore != null ? `· ${media.averageScore}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
