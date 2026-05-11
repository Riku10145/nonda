import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "../../types/index.js";
import { authHeader, testEnv } from "../../utils/_test-auth.js";

const mockSelectWhere = vi.fn();
const mockInsertValues = vi.fn();

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    select: () => ({ from: () => ({ where: mockSelectWhere }) }),
    insert: () => ({ values: mockInsertValues }),
  }),
}));

const { medicationLogsRoute } = await import("./index.js");

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";
const medicineId = "11111111-1111-1111-1111-111111111111";

const buildApp = () => {
  const app = new Hono<AppEnv>();
  app.route("/v1/medication-logs", medicationLogsRoute);
  return app;
};

const sendCreate = async (body: unknown) =>
  buildApp().request(
    "/v1/medication-logs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader(userId)) },
      body: JSON.stringify(body),
    },
    testEnv,
  );

describe("POST /v1/medication-logs", () => {
  beforeEach(() => {
    mockSelectWhere.mockReset();
    mockInsertValues.mockReset();
  });

  it("returns 201 with created count when all medicines are owned", async () => {
    mockSelectWhere.mockResolvedValueOnce([{ id: medicineId }]);
    mockInsertValues.mockResolvedValueOnce(undefined);

    const res = await sendCreate({
      logs: [{ medicine_id: medicineId, timing: "morning", is_taken: true }],
      recorded_at: "2026-05-01T00:00:00.000Z",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ created: 1 });
    expect(mockInsertValues).toHaveBeenCalledTimes(1);
  });

  it("returns 403 FORBIDDEN when a medicine belongs to another user", async () => {
    mockSelectWhere.mockResolvedValueOnce([]);

    const res = await sendCreate({
      logs: [{ medicine_id: medicineId, timing: "morning", is_taken: false }],
      recorded_at: "2026-05-01T00:00:00.000Z",
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: "FORBIDDEN", message: "指定された薬の操作権限がありません" },
    });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});
