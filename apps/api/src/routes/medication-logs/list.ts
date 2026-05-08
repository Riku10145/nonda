import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { ListMedicationLogsQuerySchema } from "../../schemas/medication-logs/index.js";
import { listMedicationLogs } from "../../services/medication-logs/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const listMedicationLogsRoute = new Hono<AppEnv>().get(
  "/",
  validator("query", ListMedicationLogsQuerySchema),
  async (c) => {
    const userId = c.get("userId");
    const { from, to } = c.req.valid("query");
    const db = createDbClient(c.env.DATABASE_URL);

    const groups = await listMedicationLogs(db, { userId, from, to });
    return c.json(
      groups.map((group) => ({
        date: group.date,
        logs: group.logs.map((log) => ({
          id: log.id,
          medicine_name: log.medicineName,
          timing: log.timing,
          is_taken: log.isTaken,
          recorded_at: log.recordedAt.toISOString(),
        })),
      })),
    );
  },
);
