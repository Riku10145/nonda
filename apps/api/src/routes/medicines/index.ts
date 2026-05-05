import { Hono } from "hono";

import type { AppEnv } from "../../types/index.js";
import { UUID_REGEX } from "../../utils/uuid.js";
import { createMedicineRoute } from "./create.js";
import { findMedicineRoute } from "./find.js";
import { listMedicinesRoute } from "./list.js";

export const medicinesRoute = new Hono<AppEnv>();

// 認証スタブ: x-user-id ヘッダで userId を受け取る。本番では Auth.js セッション検証に差し替える。
//Todo: ブラウザから叩く前に index.ts の CORS allowHeaders に x-user-id を追加する（現状は Bruno など非ブラウザのみ動作）
medicinesRoute.use("*", async (c, next) => {
  const userId = c.req.header("x-user-id");
  if (!userId || !UUID_REGEX.test(userId)) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }, 401);
  }
  c.set("userId", userId);
  await next();
});

medicinesRoute.route("/", listMedicinesRoute);
medicinesRoute.route("/", createMedicineRoute);
medicinesRoute.route("/", findMedicineRoute);
