import Image from "next/image";
import Link from "next/link";
import type { MediaCardData } from "@/lib/types";

interface MediaCardProps {
  media: MediaCardData;
}

export function mediaTitle(media: MediaCardData): string {
  return media.title.romaji || media.title.english || media.title.native || "Untitled";
}

export default function MediaCard({ media }: MediaCardProps) {
  const src = media.coverImage.large ?? media.coverImage.medium ?? "";

  return (
    <Link href={`/media/${media.id}`} className="block border border-black/10 p-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {src ? (
          <Image
            src={src}
            alt={mediaTitle(media)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-medium">{mediaTitle(media)}</p>
      <p className="text-xs text-zinc-500">
        {media.type} {media.averageScore != null ? `· ${media.averageScore}` : ""}
      </p>
    </Link>
  );
}
