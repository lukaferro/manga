import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/auth";

describe("safeReturnTo", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeReturnTo("/media/21")).toBe("/media/21");
    expect(safeReturnTo("/browse?type=ANIME&page=2")).toBe("/browse?type=ANIME&page=2");
  });

  it.each([
    ["absolute URL", "https://evil.com"],
    ["protocol-relative URL", "//evil.com"],
    // Browsers treat "/\host" like "//host"
    ["backslash trick", "/\\evil.com"],
    ["javascript URL", "javascript:alert(1)"],
    ["relative path without slash", "media/21"],
    ["empty", ""],
    ["null", null],
  ])("rejects %s", (_label, value) => {
    expect(safeReturnTo(value)).toBe("/");
  });
});
