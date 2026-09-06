import { describe, expect, it } from "vitest";

import type { JstDate, LogId, MedicineId } from "./ids";
import {
  buildDayLedger,
  buildMonthMatrix,
  expectedSlots,
  fillForDay,
  fillsForMonth,
  hrefForHistory,
  type DayGroup,
  type DayLog,
  type ExpectedSlot,
} from "./history";
import type { Medicine } from "./medicine";

const _date = (raw: string): JstDate => raw as JstDate;
const _log = (
  name: string,
  timing: DayLog["timing"],
  taken: boolean,
  recordedAt: string,
): DayLog => ({
  id: `log-${name}-${timing}` as LogId,
  name,
  timing,
  taken,
  recordedAt,
});

const _expected: ExpectedSlot[] = [
  { name: "薬A", timing: "morning" },
  { name: "薬A", timing: "evening" },
];

describe("fillForDay", () => {
  it("is none when the roster is empty", () => {
    expect(fillForDay([], [_log("薬A", "morning", true, "2026-09-06T00:00:00.000Z")])).toBe("none");
  });

  it("treats skipped logs as unfilled", () => {
    expect(
      fillForDay(_expected, [
        _log("薬A", "morning", false, "2026-09-06T00:00:00.000Z"),
        _log("薬A", "evening", false, "2026-09-06T01:00:00.000Z"),
      ]),
    ).toBe("none");
  });

  it("is partial when only some expected slots are taken", () => {
    expect(fillForDay(_expected, [_log("薬A", "morning", true, "2026-09-06T00:00:00.000Z")])).toBe(
      "partial",
    );
  });

  it("is full when every expected slot is taken", () => {
    expect(
      fillForDay(_expected, [
        _log("薬A", "morning", true, "2026-09-06T00:00:00.000Z"),
        _log("薬A", "evening", true, "2026-09-06T01:00:00.000Z"),
      ]),
    ).toBe("full");
  });

  it("uses the latest recordedAt per name×timing", () => {
    expect(
      fillForDay(_expected, [
        _log("薬A", "morning", true, "2026-09-06T00:00:00.000Z"),
        _log("薬A", "morning", false, "2026-09-06T02:00:00.000Z"),
        _log("薬A", "evening", true, "2026-09-06T01:00:00.000Z"),
      ]),
    ).toBe("partial");
  });
});

describe("fillsForMonth / buildMonthMatrix", () => {
  it("still paints omitted API days as none on a Sunday-start grid", () => {
    const month = { year: 2026, month: 9 };
    const groups: DayGroup[] = [
      {
        date: _date("2026-09-06"),
        logs: [
          _log("薬A", "morning", true, "2026-09-05T23:00:00.000Z"),
          _log("薬A", "evening", true, "2026-09-06T12:00:00.000Z"),
        ],
      },
    ];
    const fills = fillsForMonth(month, _expected, groups);
    expect(fills.get(_date("2026-09-06"))).toBe("full");
    expect(fills.get(_date("2026-09-01"))).toBe("none");
    expect(fills.get(_date("2026-09-02"))).toBe("none");

    const matrix = buildMonthMatrix(month, fills, _date("2026-09-06"));
    expect(matrix.weeks[0]?.[0]).toEqual({ kind: "outside" });
    expect(matrix.weeks[0]?.[1]).toEqual({ kind: "outside" });
    const day1 = matrix.weeks[0]?.[2];
    expect(day1).toMatchObject({ kind: "day", date: "2026-09-01", fill: "none" });
    const sunday = matrix.weeks[1]?.[0];
    expect(sunday).toMatchObject({
      kind: "day",
      date: "2026-09-06",
      fill: "full",
      isToday: true,
    });
  });
});

describe("buildDayLedger", () => {
  it("includes missing expected slots and keeps skipped distinct from missing", () => {
    const ledger = buildDayLedger(_date("2026-09-06"), _expected, {
      date: _date("2026-09-06"),
      logs: [_log("薬A", "morning", false, "2026-09-06T00:00:00.000Z")],
    });
    expect(ledger.entries).toEqual([
      {
        kind: "skipped",
        name: "薬A",
        timing: "morning",
        recordedAt: "2026-09-06T00:00:00.000Z",
      },
      { kind: "missing", name: "薬A", timing: "evening" },
    ]);
  });
});

describe("hrefForHistory", () => {
  it("puts month and day in the query string", () => {
    expect(hrefForHistory({ year: 2026, month: 9 }, _date("2026-09-06"))).toBe(
      "/history?month=2026-09&day=2026-09-06",
    );
  });
});

describe("expectedSlots", () => {
  it("expands medicines in TIMINGS then name order", () => {
    const medicines: Medicine[] = [
      { id: "m2" as MedicineId, name: "薬B", timings: ["morning"] },
      { id: "m1" as MedicineId, name: "薬A", timings: ["morning", "evening"] },
    ];
    expect(expectedSlots(medicines)).toEqual([
      { name: "薬A", timing: "morning" },
      { name: "薬B", timing: "morning" },
      { name: "薬A", timing: "evening" },
    ]);
  });
});
