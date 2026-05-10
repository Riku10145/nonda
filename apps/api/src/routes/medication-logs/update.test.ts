import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "../../types/index.js";
import { authHeader, testEnv } from "../../utils/_test-auth.js";

const mockSelectLimit = vi.fn();
const mockUpdateReturning = vi.fn();

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: mockSelectLimit }),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: mockUpdateReturning }),
      }),
    }),
  }),
}));

const { medicationLogsRoute } = await import("./index.js");

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";
const otherUserId = "11111111-1111-1111-1111-111111111111";
const logId = "22222222-2222-2222-2222-222222222222";

const buildApp = () => {
  const app = new Hono<AppEnv>();
  app.route("/v1/medication-logs", medicationLogsRoute);
  return app;
};

const sendUpdate = async (id: string, body: unknown) =>
  buildApp().request(
    `/v1/medication-logs/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader(userId)) },
      body: JSON.stringify(body),
    },
    testEnv,
  );

describe("PATCH /v1/medication-logs/:id", () => {
  beforeEach(() => {
    mockSelectLimit.mockReset();
    mockUpdateReturning.mockReset();
  });

  it("returns 200 with the updated log when the log is owned by the user", async () => {
    const updatedAt = new Date("2026-05-06T12:00:00.000Z");
    mockSelectLimit.mockResolvedValueOnce([{ id: logId, ownerId: userId }]);
    mockUpdateReturning.mockResolvedValueOnce([{ id: logId, isTaken: false, updatedAt }]);

    const res = await sendUpdate(logId, { is_taken: false });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: logId,
      is_taken: false,
      updated_at: updatedAt.toISOString(),
    });
  });

  it("returns 403 FORBIDDEN when the log belongs to another user", async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: logId, ownerId: otherUserId }]);

    const res = await sendUpdate(logId, { is_taken: true });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: "FORBIDDEN", message: "指定された服用ログの操作権限がありません" },
    });
    expect(mockUpdateReturning).not.toHaveBeenCalled();
  });

  it("returns 404 NOT_FOUND when the log does not exist", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const res = await sendUpdate(logId, { is_taken: true });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "指定された服用ログが見つかりません" },
    });
    expect(mockUpdateReturning).not.toHaveBeenCalled();
  });
});
