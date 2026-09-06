import { describe, expect, it } from "vitest";

import { formatClock, formatJstHeading, jstToday, parseJstDate, daysInMonth } from "./jst";

describe("jstToday", () => {
  it("uses +9 offset so host local getters cannot move the calendar day", () => {
    const pinned = new Date("2026-09-05T15:00:00.000Z");
    expect(jstToday(pinned)).toBe("2026-09-06");
  });

  it("stays on the previous JST day just before midnight", () => {
    const pinned = new Date("2026-09-05T14:59:59.000Z");
    expect(jstToday(pinned)).toBe("2026-09-05");
  });
});

describe("parseJstDate", () => {
  it("rejects impossible civil dates", () => {
    expect(parseJstDate("2026-02-29")).toBeNull();
    expect(parseJstDate("2026-13-01")).toBeNull();
    expect(parseJstDate("2026-09-06")).toBe("2026-09-06");
  });
});

describe("calendar math", () => {
  it("counts September 2026 days via UTC so process TZ cannot shift the grid", () => {
    expect(daysInMonth({ year: 2026, month: 9 })).toBe(30);
    expect(formatJstHeading("2026-09-06" as never)).toBe("2026年9月6日（日）");
  });
});

describe("formatClock", () => {
  it("renders JST clock from an ISO instant", () => {
    expect(formatClock("2026-09-05T23:00:00.000Z")).toBe("08:00");
  });
});
