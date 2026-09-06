import { describe, expect, it } from "vitest";

import type { JstDate, LogId, MedicineId } from "./ids";
import {
  applyBoardPatch,
  buildTodayBoard,
  commandsForMarkAllTaken,
  commandsForSetTaken,
  findSlot,
  isAllTaken,
  isTaken,
  laneSummaries,
  slotWithTaken,
  type MedicineWithLogs,
} from "./today";

const _mid = (raw: string): MedicineId => raw as MedicineId;
const _lid = (raw: string): LogId => raw as LogId;
const _date = "2026-09-06" as JstDate;

const _med = (
  id: string,
  name: string,
  timings: MedicineWithLogs["timings"],
  logs: MedicineWithLogs["logs"] = {},
): MedicineWithLogs => ({
  id: _mid(id),
  name,
  timings,
  logs,
});

describe("buildTodayBoard", () => {
  it("treats missing today_logs keys as unlogged", () => {
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning", "evening"], {
        morning: { logId: _lid("l1"), taken: true },
      }),
    ]);
    const morning = findSlot(board, _mid("m1"), "morning");
    const evening = findSlot(board, _mid("m1"), "evening");
    expect(morning).toMatchObject({ kind: "logged", taken: true, logId: "l1" });
    expect(evening).toMatchObject({ kind: "unlogged", timing: "evening" });
    expect(board.lanes.afternoon.slots).toEqual([]);
  });

  it("ignores log keys that are not on the medicine schedule", () => {
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning"], {
        evening: { logId: _lid("l9"), taken: true },
      }),
    ]);
    expect(findSlot(board, _mid("m1"), "evening")).toBeUndefined();
    expect(findSlot(board, _mid("m1"), "morning")?.kind).toBe("unlogged");
  });
});

describe("commandsForSetTaken", () => {
  it("inserts for unlogged, patches when taken flips, noops when unchanged", () => {
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning", "evening"], {
        morning: { logId: _lid("l1"), taken: true },
      }),
    ]);
    const unlogged = findSlot(board, _mid("m1"), "evening")!;
    const logged = findSlot(board, _mid("m1"), "morning")!;
    expect(commandsForSetTaken(unlogged, true)).toEqual([
      {
        type: "insert",
        rows: [{ medicineId: "m1", timing: "evening", taken: true }],
      },
    ]);
    expect(commandsForSetTaken(logged, false)).toEqual([
      { type: "update", logId: "l1", taken: false },
    ]);
    expect(commandsForSetTaken(logged, true)).toEqual([]);
    expect(commandsForSetTaken(unlogged, false)).toEqual([]);
  });
});

describe("commandsForMarkAllTaken", () => {
  it("coalesces inserts into one command and patches remaining logged slots", () => {
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning", "afternoon"], {
        morning: { logId: _lid("l1"), taken: false },
      }),
      _med("m2", "薬B", ["morning"]),
    ]);
    expect(commandsForMarkAllTaken(board)).toEqual([
      {
        type: "insert",
        rows: [
          { medicineId: "m2", timing: "morning", taken: true },
          { medicineId: "m1", timing: "afternoon", taken: true },
        ],
      },
      { type: "update", logId: "l1", taken: true },
    ]);
  });
});

describe("applyBoardPatch", () => {
  it("flips one slot and mark-all without mutating the source board", () => {
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning", "evening"], {
        morning: { logId: _lid("l1"), taken: true },
      }),
    ]);
    const unchecked = applyBoardPatch(board, {
      type: "dose",
      medicineId: _mid("m1"),
      timing: "morning",
      taken: false,
    });
    expect(isTaken(findSlot(unchecked, _mid("m1"), "morning")!)).toBe(false);
    expect(isTaken(findSlot(board, _mid("m1"), "morning")!)).toBe(true);

    const checked = applyBoardPatch(board, {
      type: "dose",
      medicineId: _mid("m1"),
      timing: "evening",
      taken: true,
    });
    expect(findSlot(checked, _mid("m1"), "evening")).toMatchObject({
      kind: "logged",
      taken: true,
    });
    expect(findSlot(board, _mid("m1"), "evening")?.kind).toBe("unlogged");

    const all = applyBoardPatch(board, { type: "all" });
    expect(isAllTaken(all)).toBe(true);
    expect(isAllTaken(board)).toBe(false);
  });

  it("does not insert when an unlogged slot is set to not taken", () => {
    const slot = buildTodayBoard(_date, [_med("m1", "薬A", ["morning"])]).lanes.morning.slots[0]!;
    expect(slotWithTaken(slot, false)).toEqual(slot);
  });
});

describe("summaries", () => {
  it("counts taken vs due and treats an empty board as all taken", () => {
    const empty = buildTodayBoard(_date, []);
    expect(isAllTaken(empty)).toBe(true);
    expect(laneSummaries(empty)).toEqual([
      { timing: "morning", taken: 0, due: 0 },
      { timing: "afternoon", taken: 0, due: 0 },
      { timing: "evening", taken: 0, due: 0 },
    ]);
    const board = buildTodayBoard(_date, [
      _med("m1", "薬A", ["morning"], { morning: { logId: _lid("l1"), taken: true } }),
    ]);
    expect(isTaken(findSlot(board, _mid("m1"), "morning")!)).toBe(true);
    expect(isAllTaken(board)).toBe(true);
  });
});
