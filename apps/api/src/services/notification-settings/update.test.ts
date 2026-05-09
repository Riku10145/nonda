import { describe, expect, it, vi } from "vitest";

import type { Db } from "../../db/client.js";
import { updateNotificationSettings } from "./update.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";

const buildDb = (returnedRows: { id: string }[]) => {
  const returning = vi.fn().mockResolvedValueOnce(returnedRows);
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  return {
    db: { insert } as unknown as Db,
    insert,
    values,
    onConflictDoUpdate,
  };
};

describe("updateNotificationSettings", () => {
  it("upserts all items and returns the count", async () => {
    const { db, values, onConflictDoUpdate } = buildDb([
      { id: "11111111-1111-1111-1111-111111111111" },
      { id: "22222222-2222-2222-2222-222222222222" },
      { id: "33333333-3333-3333-3333-333333333333" },
    ]);

    const result = await updateNotificationSettings(db, {
      userId,
      items: [
        { timing: "morning", notifyTime: "07:30", isEnabled: true },
        { timing: "afternoon", notifyTime: "12:00", isEnabled: false },
        { timing: "evening", notifyTime: "21:00", isEnabled: true },
      ],
    });

    expect(result).toEqual({ updated: 3 });
    expect(values).toHaveBeenCalledWith([
      { userId, timing: "morning", notifyTime: "07:30", isEnabled: true },
      { userId, timing: "afternoon", notifyTime: "12:00", isEnabled: false },
      { userId, timing: "evening", notifyTime: "21:00", isEnabled: true },
    ]);
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("skips the insert and returns 0 when items is empty", async () => {
    const { db, insert } = buildDb([]);

    const result = await updateNotificationSettings(db, { userId, items: [] });

    expect(result).toEqual({ updated: 0 });
    expect(insert).not.toHaveBeenCalled();
  });
});
