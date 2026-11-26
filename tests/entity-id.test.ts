import { describe, expect, it } from "vitest";
import {
  characterHref,
  isValidEntityHref,
  isValidEntityId,
  mediaHref,
  parseEntityId,
  staffHref,
} from "@/lib/entity-id";

describe("parseEntityId", () => {
  it("accepts positive integer numbers and canonical numeric strings", () => {
    expect(parseEntityId(1)).toBe(1);
    expect(parseEntityId(154587)).toBe(154587);
    expect(parseEntityId("21")).toBe(21);
    expect(parseEntityId("2147483647")).toBe(2147483647);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["literal 'null'", "null"],
    ["literal 'undefined'", "undefined"],
    ["empty string", ""],
    ["zero number", 0],
    ["zero string", "0"],
    ["negative number", -5],
    ["negative string", "-5"],
    ["float number", 12.5],
    ["float string", "12.5"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["leading zeros", "00123"],
    ["trailing characters", "123abc"],
    ["slug suffix", "123-naruto"],
    ["whitespace", " 123 "],
    ["plus sign", "+123"],
    ["exceeds 32-bit int", 2_147_483_648],
    ["object", { id: 1 }],
  ])("rejects %s", (_label, input) => {
    expect(parseEntityId(input)).toBeNull();
    expect(isValidEntityId(input)).toBe(false);
  });
});

describe("entity href helpers", () => {
  it("builds safe hrefs only for valid IDs", () => {
    expect(mediaHref(21)).toBe("/media/21");
    expect(mediaHref("null")).toBeNull();
    expect(mediaHref(null)).toBeNull();
    expect(mediaHref(undefined)).toBeNull();

    expect(characterHref(42)).toBe("/character/42");
    expect(characterHref(0)).toBeNull();

    expect(staffHref(99)).toBe("/staff/99");
    expect(staffHref(-1)).toBeNull();
  });

  it("validates stored entity hrefs", () => {
    expect(isValidEntityHref("/media/21")).toBe(true);
    expect(isValidEntityHref("/character/123")).toBe(true);
    expect(isValidEntityHref("/staff/95185")).toBe(true);

    expect(isValidEntityHref("/media/null")).toBe(false);
    expect(isValidEntityHref("/media/undefined")).toBe(false);
    expect(isValidEntityHref("/media/0")).toBe(false);
    expect(isValidEntityHref("/media/123abc")).toBe(false);
    expect(isValidEntityHref("https://evil.com/media/1")).toBe(false);
  });
});
