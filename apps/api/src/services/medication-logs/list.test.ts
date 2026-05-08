import { describe, expect, it, vi } from "vitest";

import type { Db } from "../../db/client.js";
import { listMedicationLogs } from "./list.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";

interface Row {
  id: string;
  medicineName: string;
  timing: "morning" | "afternoon" | "evening";
  isTaken: boolean;
  recordedAt: Date;
}

const buildDb = (rows: Row[]) => {
  const orderBy = vi.fn().mockResolvedValueOnce(rows);
  const where = vi.fn(() => ({ orderBy }));
  const innerJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ innerJoin }));
  const select = vi.fn(() => ({ from }));
  return { db: { select } as unknown as Db };
};

describe("listMedicationLogs", () => {
  it("returns groups in date desc with logs in recordedAt asc, grouped by JST date", async () => {
    // 2026-04-29 JST 08:00 = 2026-04-28T23:00:00Z
    // 2026-04-29 JST 20:00 = 2026-04-29T11:00:00Z
    // 2026-04-30 JST 08:00 = 2026-04-29T23:00:00Z
    const { db } = buildDb([
      {
        id: "11111111-1111-1111-1111-111111111111",
        medicineName: "薬 A",
        timing: "morning",
        isTaken: true,
        recordedAt: new Date("2026-04-28T23:00:00.000Z"),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        medicineName: "薬 B",
        timing: "evening",
        isTaken: false,
        recordedAt: new Date("2026-04-29T11:00:00.000Z"),
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        medicineName: "薬 A",
        timing: "morning",
        isTaken: true,
        recordedAt: new Date("2026-04-29T23:00:00.000Z"),
      },
    ]);

    const result = await listMedicationLogs(db, {
      userId,
      from: "2026-04-29",
      to: "2026-04-30",
    });

    expect(result).toEqual([
      {
        date: "2026-04-30",
        logs: [
          {
            id: "33333333-3333-3333-3333-333333333333",
            medicineName: "薬 A",
            timing: "morning",
            isTaken: true,
            recordedAt: new Date("2026-04-29T23:00:00.000Z"),
          },
        ],
      },
      {
        date: "2026-04-29",
        logs: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            medicineName: "薬 A",
            timing: "morning",
            isTaken: true,
            recordedAt: new Date("2026-04-28T23:00:00.000Z"),
          },
          {
            id: "22222222-2222-2222-2222-222222222222",
            medicineName: "薬 B",
            timing: "evening",
            isTaken: false,
            recordedAt: new Date("2026-04-29T11:00:00.000Z"),
          },
        ],
      },
    ]);
  });

  it("returns an empty array when there are no logs in the period", async () => {
    const { db } = buildDb([]);

    const result = await listMedicationLogs(db, {
      userId,
      from: "2026-04-01",
      to: "2026-04-30",
    });

    expect(result).toEqual([]);
  });
});
