import { describe, expect, it } from "vitest";
import { filtersToQuery, formatsForType, parseBrowseParams } from "@/lib/browse-filters";

function parse(query: string) {
  const params = new URLSearchParams(query);
  return parseBrowseParams((key) => params.get(key));
}

describe("parseBrowseParams", () => {
  it("accepts valid filters", () => {
    const { filters, page } = parse(
      "search=frieren&type=ANIME&genre=Drama&sort=SCORE_DESC&season=FALL&year=2023&format=TV&status=FINISHED&page=3",
    );
    expect(page).toBe(3);
    expect(filters).toEqual({
      search: "frieren",
      type: "ANIME",
      genre: "Drama",
      sort: "SCORE_DESC",
      season: "FALL",
      year: 2023,
      format: "TV",
      status: "FINISHED",
    });
  });

  it("drops invalid enum values, years and pages", () => {
    const { filters, page } = parse("type=MOVIE&sort=RANDOM&year=abc&format=VHS&page=-4");
    expect(page).toBe(1);
    expect(filters.type).toBeUndefined();
    expect(filters.sort).toBeUndefined();
    expect(filters.year).toBeUndefined();
    expect(filters.format).toBeUndefined();
  });

  it("trims and bounds free text", () => {
    const { filters } = parse(`search=${"a".repeat(300)}`);
    expect(filters.search).toHaveLength(100);
    expect(parse("search=%20%20").filters.search).toBeUndefined();
  });
});

describe("filtersToQuery", () => {
  it("builds a stable query without empty values", () => {
    expect(filtersToQuery({ genre: "Drama", type: "MANGA", year: 2020 })).toBe(
      "type=MANGA&genre=Drama&year=2020",
    );
    expect(filtersToQuery({})).toBe("");
  });

  it("round-trips through parseBrowseParams", () => {
    const filters = { search: "one piece", type: "ANIME" as const, status: "RELEASING" as const };
    expect(parse(filtersToQuery(filters)).filters).toMatchObject(filters);
  });
});

describe("formatsForType", () => {
  it("narrows formats to the media type", () => {
    expect(formatsForType("MANGA")).toEqual(["MANGA", "NOVEL", "ONE_SHOT"]);
    expect(formatsForType("ANIME")).not.toContain("MANGA");
    expect(formatsForType(undefined)).toHaveLength(10);
  });
});
