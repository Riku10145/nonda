import { describe, expect, it, vi } from "vitest";

import type { Db } from "../../db/client.js";
import { createMedicationLogs } from "./create.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";
const medicineA = "11111111-1111-1111-1111-111111111111";
const medicineB = "22222222-2222-2222-2222-222222222222";

const buildDb = (ownedRows: { id: string }[]) => {
  const where = vi.fn().mockResolvedValueOnce(ownedRows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const values = vi.fn().mockResolvedValueOnce(undefined);
  const insert = vi.fn(() => ({ values }));
  return { db: { select, insert } as unknown as Db, where, values, insert };
};

describe("createMedicationLogs", () => {
  it("inserts all logs in a single statement when every medicine is owned by user", async () => {
    const recordedAt = new Date("2026-05-01T00:00:00.000Z");
    const { db, values } = buildDb([{ id: medicineA }, { id: medicineB }]);

    const result = await createMedicationLogs(db, {
      userId,
      logs: [
        { medicineId: medicineA, timing: "morning", isTaken: true },
        { medicineId: medicineB, timing: "evening", isTaken: false },
      ],
      recordedAt,
    });

    expect(result).toEqual({ created: 2 });
    expect(values).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith([
      { medicineId: medicineA, timing: "morning", recordedAt, isTaken: true },
      { medicineId: medicineB, timing: "evening", recordedAt, isTaken: false },
    ]);
  });

  it("returns forbidden and skips the insert when any medicine is not owned by user", async () => {
    const { db, insert } = buildDb([{ id: medicineA }]);

    const result = await createMedicationLogs(db, {
      userId,
      logs: [
        { medicineId: medicineA, timing: "morning", isTaken: true },
        { medicineId: medicineB, timing: "evening", isTaken: true },
      ],
      recordedAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(result).toEqual({ forbidden: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("deduplicates medicineIds when checking ownership", async () => {
    const { db, values } = buildDb([{ id: medicineA }]);

    const result = await createMedicationLogs(db, {
      userId,
      logs: [
        { medicineId: medicineA, timing: "morning", isTaken: true },
        { medicineId: medicineA, timing: "evening", isTaken: false },
      ],
      recordedAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(result).toEqual({ created: 2 });
    expect(values).toHaveBeenCalledTimes(1);
  });
});
