import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { GetMedicineParamSchema } from "../../schemas/medicines/index.js";
import { getMedicineById } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";

export const getMedicineRoute = new Hono<AppEnv>().get(
  "/:id",
  sValidator("param", GetMedicineParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id: medicineId } = c.req.valid("param");

    const db = createDbClient(c.env.DATABASE_URL);
    const medicine = await getMedicineById(db, { userId, medicineId });

    if (!medicine) {
      return c.json({ error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" } }, 404);
    }

    return c.json({
      id: medicine.id,
      name: medicine.name,
      photo_url: medicine.photoUrl,
      timings: medicine.timings,
      created_at: medicine.createdAt,
      updated_at: medicine.updatedAt,
    });
  },
);
