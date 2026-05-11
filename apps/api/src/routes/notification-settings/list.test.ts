import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "../../types/index.js";
import { authHeader, testEnv } from "../../utils/_test-auth.js";

const mockSelectWhere = vi.fn();

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    select: () => ({
      from: () => ({ where: mockSelectWhere }),
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

const sendList = async (headers?: Record<string, string>) =>
  buildApp().request(
    "/v1/notification-settings",
    { method: "GET", headers: headers ?? (await authHeader(userId)) },
    testEnv,
  );

describe("GET /v1/notification-settings", () => {
  beforeEach(() => {
    mockSelectWhere.mockReset();
  });

  it("returns 200 with stored settings filled by defaults in fixed timing order", async () => {
    mockSelectWhere.mockResolvedValueOnce([
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "morning",
        notifyTime: "07:30:00",
        isEnabled: false,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        timing: "evening",
        notifyTime: "21:00:00",
        isEnabled: true,
      },
    ]);

    const res = await sendList();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        timing: "morning",
        notify_time: "07:30",
        is_enabled: false,
      },
      { id: null, timing: "afternoon", notify_time: "12:00", is_enabled: true },
      {
        id: "22222222-2222-2222-2222-222222222222",
        timing: "evening",
        notify_time: "21:00",
        is_enabled: true,
      },
    ]);
  });

  it("returns 401 UNAUTHORIZED when Authorization header is missing", async () => {
    const res = await sendList({});

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "ログインが必要です" },
    });
    expect(mockSelectWhere).not.toHaveBeenCalled();
  });
});
