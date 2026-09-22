import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "../../types/index.js";
import { authHeader, testEnv } from "../../utils/_test-auth.js";

const userId = "87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7";
const medicineId = "11111111-1111-1111-1111-111111111111";
const createdAt = new Date("2026-05-06T01:00:00.000Z");
const updatedAt = new Date("2026-05-06T02:00:00.000Z");

interface MedicineInsert {
  id: string;
  name: string;
}

interface DbState {
  selects: unknown[][];
  batch: unknown;
  updateRows: unknown[];
  deleteRows: unknown[];
  inserted: unknown[];
}

const state: DbState = {
  selects: [],
  batch: undefined,
  updateRows: [],
  deleteRows: [],
  inserted: [],
};

const _rows = (rows: unknown[]) => {
  const pending = Promise.resolve(rows);
  return Object.assign(pending, {
    orderBy: () => pending,
    limit: () => pending,
  });
};

vi.mock("../../db/client.js", () => ({
  createDbClient: () => ({
    select: () => ({
      from: () => ({
        where: () => _rows(state.selects.shift() ?? []),
      }),
    }),
    insert: () => ({
      values: (value: unknown) => {
        state.inserted.push(value);
        return { returning: () => ({}) };
      },
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(state.updateRows),
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve(state.deleteRows),
      }),
    }),
    batch: () => {
      if (state.batch !== undefined) return Promise.resolve(state.batch);
      const medicine = state.inserted.find(
        (row): row is MedicineInsert =>
          typeof row === "object" && row !== null && !Array.isArray(row) && "name" in row,
      );
      if (!medicine) return Promise.reject(new Error("batch without a medicine insert"));
      return Promise.resolve([[{ id: medicine.id, name: medicine.name, createdAt }]]);
    },
  }),
}));

const { medicinesRoute } = await import("./index.js");

const buildApp = () => {
  const app = new Hono<AppEnv>();
  app.route("/v1/medicines", medicinesRoute);
  return app;
};

const send = (path: string, init: { method: string; body?: unknown; auth?: boolean }) => {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  return (async () => {
    if (init.auth !== false) Object.assign(headers, await authHeader(userId));
    return buildApp().request(
      path,
      {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      },
      testEnv,
    );
  })();
};

describe("medicines HTTP", () => {
  beforeEach(() => {
    state.selects = [];
    state.batch = undefined;
    state.updateRows = [];
    state.deleteRows = [];
    state.inserted = [];
  });

  it("returns 401 when Authorization is missing", async () => {
    const res = await send("/v1/medicines", { method: "GET", auth: false });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "ログインが必要です" },
    });
  });

  it("returns 422 when today is not true or false", async () => {
    const res = await send("/v1/medicines?today=TRUE", { method: "GET" });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        details: [
          {
            field: "today",
            message: 'Invalid type: Expected ("true" | "false") but received "TRUE"',
          },
        ],
      },
    });
  });

  it("returns medicines with timings in row order and keeps an empty timing list", async () => {
    state.selects = [
      [
        { id: medicineId, name: "ロキソニン" },
        { id: "33333333-3333-3333-3333-333333333333", name: "空" },
      ],
      [
        { medicineId, timing: "evening" },
        { medicineId, timing: "morning" },
      ],
    ];

    const res = await send("/v1/medicines", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: medicineId, name: "ロキソニン", timings: ["evening", "morning"] },
      { id: "33333333-3333-3333-3333-333333333333", name: "空", timings: [] },
    ]);
  });

  it("returns today_logs in snake_case and keeps the newest log per timing", async () => {
    const newer = new Date("2026-05-06T00:30:00.000Z");
    const older = new Date("2026-05-05T23:00:00.000Z");
    state.selects = [
      [{ id: medicineId, name: "ロキソニン" }],
      [{ medicineId, timing: "morning" }],
      [
        {
          id: "44444444-4444-4444-4444-444444444444",
          medicineId,
          timing: "morning",
          isTaken: true,
          recordedAt: newer,
        },
        {
          id: "55555555-5555-5555-5555-555555555555",
          medicineId,
          timing: "morning",
          isTaken: false,
          recordedAt: older,
        },
        {
          id: "66666666-6666-6666-6666-666666666666",
          medicineId,
          timing: "evening",
          isTaken: false,
          recordedAt: newer,
        },
      ],
    ];

    const res = await send("/v1/medicines?today=true", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: medicineId,
        name: "ロキソニン",
        timings: ["morning"],
        today_logs: {
          morning: { log_id: "44444444-4444-4444-4444-444444444444", is_taken: true },
          evening: { log_id: "66666666-6666-6666-6666-666666666666", is_taken: false },
        },
      },
    ]);
  });

  it("returns 201 with a trimmed name, first-seen timings, and created_at", async () => {
    const res = await send("/v1/medicines", {
      method: "POST",
      body: { name: "  ロキソニン  ", timings: ["evening", "morning", "evening"] },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      timings: string[];
      created_at: string;
    };
    const inserted = state.inserted[0] as MedicineInsert;
    expect(body).toEqual({
      id: inserted.id,
      name: "ロキソニン",
      timings: ["evening", "morning"],
      created_at: createdAt.toISOString(),
    });
  });

  it("returns 422 when the name is blank", async () => {
    const res = await send("/v1/medicines", {
      method: "POST",
      body: { name: "   ", timings: ["morning"] },
    });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        details: [{ field: "name", message: "Invalid length: Expected >=1 but received 0" }],
      },
    });
  });

  it("returns 200 with created_at and updated_at", async () => {
    state.selects = [
      [{ id: medicineId, name: "ロキソニン", createdAt, updatedAt }],
      [{ timing: "afternoon" }, { timing: "morning" }],
    ];

    const res = await send(`/v1/medicines/${medicineId}`, { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: medicineId,
      name: "ロキソニン",
      timings: ["afternoon", "morning"],
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });
  });

  it("returns 404 when the medicine is missing", async () => {
    state.selects = [[]];

    const res = await send(`/v1/medicines/${medicineId}`, { method: "GET" });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" },
    });
  });

  it("returns 422 when the id is not a uuid", async () => {
    const res = await send("/v1/medicines/not-a-uuid", { method: "GET" });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        details: [
          {
            field: "id",
            message:
              'Invalid format: Expected /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i but received "not-a-uuid"',
          },
        ],
      },
    });
  });

  it("returns 200 with request timing order when timings are replaced", async () => {
    state.selects = [[{ id: medicineId }]];
    state.batch = [[{ id: medicineId, name: "新しい名前", updatedAt }]];

    const res = await send(`/v1/medicines/${medicineId}`, {
      method: "PATCH",
      body: { name: "新しい名前", timings: ["evening", "morning", "evening"] },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: medicineId,
      name: "新しい名前",
      timings: ["evening", "morning"],
      updated_at: updatedAt.toISOString(),
    });
  });

  it("returns 200 with stored timing order when only the name changes", async () => {
    state.selects = [[{ id: medicineId }], [{ timing: "evening" }, { timing: "afternoon" }]];
    state.updateRows = [{ id: medicineId, name: "改名", updatedAt }];

    const res = await send(`/v1/medicines/${medicineId}`, {
      method: "PATCH",
      body: { name: "改名" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: medicineId,
      name: "改名",
      timings: ["evening", "afternoon"],
      updated_at: updatedAt.toISOString(),
    });
  });

  it("returns 404 when the patch target is missing", async () => {
    state.selects = [[]];

    const res = await send(`/v1/medicines/${medicineId}`, {
      method: "PATCH",
      body: { name: "改名" },
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" },
    });
  });

  it("returns 422 when the patch body is empty", async () => {
    const res = await send(`/v1/medicines/${medicineId}`, {
      method: "PATCH",
      body: {},
    });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        details: [{ message: "更新するフィールドを少なくとも1つ指定してください" }],
      },
    });
  });

  it("returns 204 when the medicine is deleted", async () => {
    state.deleteRows = [{ id: medicineId }];

    const res = await send(`/v1/medicines/${medicineId}`, { method: "DELETE" });

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("returns 404 when the delete target is missing", async () => {
    state.deleteRows = [];

    const res = await send(`/v1/medicines/${medicineId}`, { method: "DELETE" });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" },
    });
  });
});
