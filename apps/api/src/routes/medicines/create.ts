import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { CreateMedicineSchema } from "../../schemas/medicines/index.js";
import { createMedicine } from "../../services/medicines/index.js";
import type { AppEnv } from "../../types/index.js";

export const createMedicineRoute = new Hono<AppEnv>().post(
  "/",
  sValidator("json", CreateMedicineSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = createDbClient(c.env.DATABASE_URL);

    const created = await createMedicine(db, {
      userId,
      name: body.name,
      timings: body.timings,
      photoUrl: body.photo_url ?? null,
    });

    return c.json(
      {
        id: created.id,
        name: created.name,
        timings: created.timings,
        photo_url: created.photoUrl,
        created_at: created.createdAt,
      },
      201,
    );
  },
);
