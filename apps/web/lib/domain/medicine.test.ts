import { describe, expect, it } from "vitest";

import { initialGlyph, timingsFromSelection } from "./medicine";

describe("timingsFromSelection", () => {
  it("returns null when empty instead of []", () => {
    expect(timingsFromSelection({ morning: false, afternoon: false, evening: false })).toBeNull();
  });

  it("keeps TIMINGS order", () => {
    expect(timingsFromSelection({ morning: true, afternoon: false, evening: true })).toEqual([
      "morning",
      "evening",
    ]);
  });
});

describe("initialGlyph", () => {
  it("takes the first grapheme and falls back to 薬", () => {
    expect(initialGlyph("ビタミンC")).toBe("ビ");
    expect(initialGlyph("  薬A")).toBe("薬");
    expect(initialGlyph("   ")).toBe("薬");
  });
});
