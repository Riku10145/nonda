import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv, Bindings } from "../../types/index.js";

const mockOrderBy = vi.fn();

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ orderBy: mockOrderBy }),
        }),
      }),
    }),
  }),
}));

const { medicationLogsRoute } = await import("./index.js");

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";

const env: Bindings = {
  DATABASE_URL: "postgres://test",
  FRONTEND_URL: "http://localhost:3000",
};

const buildApp = () => {
  const app = new Hono<AppEnv>();
  app.route("/v1/medication-logs", medicationLogsRoute);
  return app;
};

const sendList = (query: string) =>
  buildApp().request(
    `/v1/medication-logs${query}`,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    env,
  );

describe("GET /v1/medication-logs", () => {
  beforeEach(() => {
    mockOrderBy.mockReset();
  });

  it("returns 200 with logs grouped by JST date in date desc order", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        id: "11111111-1111-1111-1111-111111111111",
        medicineName: "薬 A",
        timing: "morning",
        isTaken: true,
        recordedAt: new Date("2026-04-28T23:00:00.000Z"),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        medicineName: "薬 A",
        timing: "morning",
        isTaken: true,
        recordedAt: new Date("2026-04-29T23:00:00.000Z"),
      },
    ]);

    const res = await sendList("?from=2026-04-29&to=2026-04-30");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        date: "2026-04-30",
        logs: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            medicine_name: "薬 A",
            timing: "morning",
            is_taken: true,
            recorded_at: "2026-04-29T23:00:00.000Z",
          },
        ],
      },
      {
        date: "2026-04-29",
        logs: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            medicine_name: "薬 A",
            timing: "morning",
            is_taken: true,
            recorded_at: "2026-04-28T23:00:00.000Z",
          },
        ],
      },
    ]);
  });

  it("returns 422 VALIDATION_ERROR when from / to is missing or malformed", async () => {
    const res = await sendList("?from=2026-04-29");

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockOrderBy).not.toHaveBeenCalled();
  });
});
