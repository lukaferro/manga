import Image from "next/image";
import Link from "next/link";
import type { MediaCardData } from "@/lib/types";
import styles from "./MediaCard.module.css";

interface MediaCardProps {
  media: MediaCardData;
}

export function mediaTitle(media: MediaCardData): string {
  return media.title.romaji || media.title.english || media.title.native || "Untitled";
}

export default function MediaCard({ media }: MediaCardProps) {
  const src = media.coverImage.large ?? media.coverImage.medium ?? "";

  return (
    <Link href={`/media/${media.id}`} className={styles.card}>
      <div className={styles.cover}>
        {src ? (
          <Image
            src={src}
            alt={mediaTitle(media)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className={styles.image}
          />
        ) : null}
      </div>
      <p className={styles.title}>{mediaTitle(media)}</p>
      <p className={styles.meta}>
        {media.type} {media.averageScore != null ? `· ${media.averageScore}` : ""}
      </p>
    </Link>
  );
}
