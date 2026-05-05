import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { findMedicineById } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";
import { UUID_REGEX } from "../../utils/uuid.js";

export const findMedicineRoute = new Hono<AppEnv>().get("/:id", async (c) => {
  const userId = c.get("userId");
  const medicineId = c.req.param("id");

  if (!UUID_REGEX.test(medicineId)) {
    return c.json({ error: { code: "NOT_FOUND", message: "指定された薬が見つかりません" } }, 404);
  }

  const db = createDbClient(c.env.DATABASE_URL);
  const medicine = await findMedicineById(db, { userId, medicineId });

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
});
