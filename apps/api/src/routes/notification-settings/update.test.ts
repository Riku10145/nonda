import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "../../types/index.js";
import { authHeader, testEnv } from "../../utils/_test-auth.js";

const mockInsertReturning = vi.fn();

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({ returning: mockInsertReturning }),
      }),
    }),
  }),
}));

const { notificationSettingsRoute } = await import("./index.js");

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";

const buildApp = () => {
  const app = new Hono<AppEnv>();
  app.route("/v1/notification-settings", notificationSettingsRoute);
  return app;
};

const sendUpdate = async (body: unknown, headers?: Record<string, string>) =>
  buildApp().request(
    "/v1/notification-settings",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(headers ?? (await authHeader(userId))) },
      body: JSON.stringify(body),
    },
    testEnv,
  );

describe("PUT /v1/notification-settings", () => {
  beforeEach(() => {
    mockInsertReturning.mockReset();
  });

  it("returns 200 with updated count when all timings are upserted", async () => {
    mockInsertReturning.mockResolvedValueOnce([
      { id: "11111111-1111-1111-1111-111111111111" },
      { id: "22222222-2222-2222-2222-222222222222" },
      { id: "33333333-3333-3333-3333-333333333333" },
    ]);

    const res = await sendUpdate([
      { timing: "morning", notify_time: "07:30", is_enabled: true },
      { timing: "afternoon", notify_time: "12:00", is_enabled: false },
      { timing: "evening", notify_time: "21:00", is_enabled: true },
    ]);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated: 3 });
  });

  it("returns 422 VALIDATION_ERROR when notify_time is not HH:MM", async () => {
    const res = await sendUpdate([{ timing: "morning", notify_time: "7:30", is_enabled: true }]);

    expect(res.status).toBe(422);
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });

  it("returns 422 VALIDATION_ERROR when timings are duplicated", async () => {
    const res = await sendUpdate([
      { timing: "morning", notify_time: "07:30", is_enabled: true },
      { timing: "morning", notify_time: "08:00", is_enabled: false },
    ]);

    expect(res.status).toBe(422);
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });

  it("returns 401 UNAUTHORIZED when Authorization header is missing", async () => {
    const res = await sendUpdate(
      [{ timing: "morning", notify_time: "07:30", is_enabled: true }],
      {},
    );

    expect(res.status).toBe(401);
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });
});
