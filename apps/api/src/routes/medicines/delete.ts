import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { DeleteMedicineParamSchema } from "../../schemas/medicines/index.js";
import { deleteMedicineById } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const deleteMedicineRoute = new Hono<AppEnv>().delete(
  "/:id",
  validator("param", DeleteMedicineParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id: medicineId } = c.req.valid("param");

    const db = createDbClient(c.env.DATABASE_URL);
    const deleted = await deleteMedicineById(db, { userId, medicineId });

    if (!deleted) {
      return c.json({ error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" } }, 404);
    }

    return c.body(null, 204);
  },
);
