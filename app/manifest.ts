import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manga & Anime",
    short_name: "Manga & Anime",
    description: "Browse, track and discover anime and manga, powered by AniList",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0b0c",
    theme_color: "#d63a5a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
