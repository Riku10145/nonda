import { describe, expect, it, vi } from "vitest";

import type { Db } from "../../db/client.js";
import { listNotificationSettings } from "./list.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";

interface Row {
  id: string;
  timing: "morning" | "afternoon" | "evening";
  notifyTime: string;
  isEnabled: boolean;
}

const buildDb = (rows: Row[]) => {
  const where = vi.fn().mockResolvedValueOnce(rows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { db: { select } as unknown as Db };
};

describe("listNotificationSettings", () => {
  it("returns morning -> afternoon -> evening, normalizing TIME values to HH:MM", async () => {
    const { db } = buildDb([
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "evening",
        notifyTime: "21:00:00",
        isEnabled: true,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        timing: "morning",
        notifyTime: "07:30:00",
        isEnabled: false,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        timing: "afternoon",
        notifyTime: "12:00:00",
        isEnabled: true,
      },
    ]);

    const result = await listNotificationSettings(db, { userId });

    expect(result).toEqual([
      {
        id: "22222222-2222-2222-2222-222222222222",
        timing: "morning",
        notifyTime: "07:30",
        isEnabled: false,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        timing: "afternoon",
        notifyTime: "12:00",
        isEnabled: true,
      },
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "evening",
        notifyTime: "21:00",
        isEnabled: true,
      },
    ]);
  });

  it("fills missing timings with defaults (id null, is_enabled true)", async () => {
    const { db } = buildDb([
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "morning",
        notifyTime: "07:30:00",
        isEnabled: false,
      },
    ]);

    const result = await listNotificationSettings(db, { userId });

    expect(result).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "morning",
        notifyTime: "07:30",
        isEnabled: false,
      },
      { id: null, timing: "afternoon", notifyTime: "12:00", isEnabled: true },
      { id: null, timing: "evening", notifyTime: "21:00", isEnabled: true },
    ]);
  });

  it("returns all defaults when the user has no settings yet", async () => {
    const { db } = buildDb([]);

    const result = await listNotificationSettings(db, { userId });

    expect(result).toEqual([
      { id: null, timing: "morning", notifyTime: "08:00", isEnabled: true },
      { id: null, timing: "afternoon", notifyTime: "12:00", isEnabled: true },
      { id: null, timing: "evening", notifyTime: "21:00", isEnabled: true },
    ]);
  });
});
