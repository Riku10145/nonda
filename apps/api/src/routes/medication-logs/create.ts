import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { CreateMedicationLogsSchema } from "../../schemas/medication-logs/index.js";
import { createMedicationLogs } from "../../services/medication-logs/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const createMedicationLogsRoute = new Hono<AppEnv>().post(
  "/",
  validator("json", CreateMedicationLogsSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = createDbClient(c.env.DATABASE_URL);

    const result = await createMedicationLogs(db, {
      userId,
      logs: body.logs.map((log) => ({
        medicineId: log.medicine_id,
        timing: log.timing,
        isTaken: log.is_taken,
      })),
      recordedAt: new Date(body.recorded_at),
    });

    if ("forbidden" in result) {
      return c.json(
        { error: { code: "FORBIDDEN", message: "指定された薬の操作権限がありません" } },
        403,
      );
    }

    return c.json({ created: result.created }, 201);
  },
);
