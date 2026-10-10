import { describe, expect, it } from "vitest";
import { localizeAniListLinks } from "@/lib/anilist";

describe("localizeAniListLinks", () => {
  it("rewrites AniList entity links to in-app routes", () => {
    const html =
      '<a href="https://anilist.co/character/123/Fern">Fern</a> and ' +
      "<a href='https://anilist.co/anime/154587/Sousou-no-Frieren/'>show</a> " +
      '<a href="https://anilist.co/manga/118586">manga</a> ' +
      '<a href="https://anilist.co/staff/95185/Atsumi-Tanezaki">VA</a>';
    expect(localizeAniListLinks(html)).toBe(
      '<a href="/character/123">Fern</a> and ' +
        "<a href='/media/154587'>show</a> " +
        '<a href="/media/118586">manga</a> ' +
        '<a href="/staff/95185">VA</a>',
    );
  });

  it("leaves other links untouched", () => {
    const html = '<a href="https://twitter.com/x">t</a> <a href="https://anilist.co/user/foo">u</a>';
    expect(localizeAniListLinks(html)).toBe(html);
  });
});
