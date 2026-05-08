import { describe, expect, it, vi } from "vitest";

import type { Db } from "../../db/client.js";
import { updateMedicationLog } from "./update.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";
const otherUserId = "11111111-1111-1111-1111-111111111111";
const logId = "22222222-2222-2222-2222-222222222222";

const buildDb = (
  selectRows: { id: string; ownerId: string }[],
  updatedRows: { id: string; isTaken: boolean; updatedAt: Date }[],
) => {
  const limit = vi.fn().mockResolvedValueOnce(selectRows);
  const where = vi.fn(() => ({ limit }));
  const innerJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ innerJoin }));
  const select = vi.fn(() => ({ from }));

  const returning = vi.fn().mockResolvedValueOnce(updatedRows);
  const updateWhere = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  return { db: { select, update } as unknown as Db, set, update };
};

describe("updateMedicationLog", () => {
  it("updates is_taken when the log is owned by the user", async () => {
    const updatedAt = new Date("2026-05-06T12:00:00.000Z");
    const { db, set } = buildDb(
      [{ id: logId, ownerId: userId }],
      [{ id: logId, isTaken: false, updatedAt }],
    );

    const result = await updateMedicationLog(db, { userId, logId, isTaken: false });

    expect(result).toEqual({ updated: { id: logId, isTaken: false, updatedAt } });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ isTaken: false, updatedAt: expect.any(Date) }),
    );
  });

  it("returns notFound and skips the update when the log does not exist", async () => {
    const { db, update } = buildDb([], []);

    const result = await updateMedicationLog(db, { userId, logId, isTaken: true });

    expect(result).toEqual({ notFound: true });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns forbidden and skips the update when the medicine belongs to another user", async () => {
    const { db, update } = buildDb([{ id: logId, ownerId: otherUserId }], []);

    const result = await updateMedicationLog(db, { userId, logId, isTaken: true });

    expect(result).toEqual({ forbidden: true });
    expect(update).not.toHaveBeenCalled();
  });
});
