import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { UpdateMedicineParamSchema, UpdateMedicineSchema } from "../../schemas/medicines/index.js";
import { updateMedicine } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const updateMedicineRoute = new Hono<AppEnv>().patch(
  "/:id",
  validator("param", UpdateMedicineParamSchema),
  validator("json", UpdateMedicineSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id: medicineId } = c.req.valid("param");
    const body = c.req.valid("json");

    const db = createDbClient(c.env.DATABASE_URL);
    const updated = await updateMedicine(db, {
      userId,
      medicineId,
      name: body.name,
      timings: body.timings,
    });

    if (!updated) {
      return c.json({ error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" } }, 404);
    }

    return c.json({
      id: updated.id,
      name: updated.name,
      timings: updated.timings,
      updated_at: updated.updatedAt,
    });
  },
);
