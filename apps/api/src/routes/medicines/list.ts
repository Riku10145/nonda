import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { ListMedicinesQuerySchema } from "../../schemas/medicines/index.js";
import { listMedicines, listMedicinesWithTodayLogs } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const listMedicinesRoute = new Hono<AppEnv>().get(
  "/",
  validator("query", ListMedicinesQuerySchema),
  async (c) => {
    const userId = c.get("userId");
    const { today } = c.req.valid("query");
    const db = createDbClient(c.env.DATABASE_URL);

    if (today !== "true") {
      const items = await listMedicines(db, userId);
      return c.json(
        items.map((medicine) => ({
          id: medicine.id,
          name: medicine.name,
          photo_url: medicine.photoUrl,
          timings: medicine.timings,
        })),
      );
    }

    const items = await listMedicinesWithTodayLogs(db, userId);
    return c.json(
      items.map((medicine) => ({
        id: medicine.id,
        name: medicine.name,
        photo_url: medicine.photoUrl,
        timings: medicine.timings,
        today_logs: Object.fromEntries(
          Object.entries(medicine.todayLogs).map(([timing, log]) => [
            timing,
            { log_id: log.logId, is_taken: log.isTaken },
          ]),
        ),
      })),
    );
  },
);
