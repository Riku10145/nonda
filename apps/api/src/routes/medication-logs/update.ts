import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import {
  UpdateMedicationLogParamSchema,
  UpdateMedicationLogSchema,
} from "../../schemas/medication-logs/index.js";
import { updateMedicationLog } from "../../services/medication-logs/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const updateMedicationLogRoute = new Hono<AppEnv>().patch(
  "/:id",
  validator("param", UpdateMedicationLogParamSchema),
  validator("json", UpdateMedicationLogSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id: logId } = c.req.valid("param");
    const body = c.req.valid("json");

    const db = createDbClient(c.env.DATABASE_URL);
    const result = await updateMedicationLog(db, {
      userId,
      logId,
      isTaken: body.is_taken,
    });

    if ("notFound" in result) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "指定された服用ログが見つかりません" } },
        404,
      );
    }

    if ("forbidden" in result) {
      return c.json(
        { error: { code: "FORBIDDEN", message: "指定された服用ログの操作権限がありません" } },
        403,
      );
    }

    return c.json({
      id: result.updated.id,
      is_taken: result.updated.isTaken,
      updated_at: result.updated.updatedAt,
    });
  },
);
