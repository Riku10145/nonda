import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import * as v from "valibot";

import { createDbClient } from "../../db/client.js";
import { medicines, medicineTimings } from "../../db/schema.js";
import { type MedicinesEnv, TimingSchema } from "./_shared.js";

const CreateMedicineSchema = v.object({
  //Todo: nameの最大長は255だと無駄かなと思う。もっと短くても良いかも
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  timings: v.pipe(v.array(TimingSchema), v.minLength(1)),
  photo_url: v.optional(v.pipe(v.string(), v.url())),
});

export const createMedicine = new Hono<MedicinesEnv>().post(
  "/",
  sValidator("json", CreateMedicineSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = createDbClient(c.env.DATABASE_URL);

    const uniqueTimings = [...new Set(body.timings)];
    const medicineId = crypto.randomUUID();

    const [[inserted]] = await db.batch([
      db
        .insert(medicines)
        .values({
          id: medicineId,
          userId,
          name: body.name,
          photoUrl: body.photo_url ?? null,
        })
        .returning(),
      db.insert(medicineTimings).values(
        uniqueTimings.map((timing) => ({
          medicineId,
          timing,
        })),
      ),
    ]);

    return c.json(
      {
        id: inserted.id,
        name: inserted.name,
        timings: uniqueTimings,
        photo_url: inserted.photoUrl,
        created_at: inserted.createdAt,
      },
      201,
    );
  },
);
