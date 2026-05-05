import { sValidator } from "@hono/standard-validator";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";

import { createDbClient } from "../../db/client.js";
import { medicationLogs, medicines, medicineTimings } from "../../db/schema.js";
import { getJstTodayRange } from "../../lib/jst.js";
import type { MedicinesEnv, Timing } from "./_shared.js";

const ListMedicinesQuerySchema = v.object({
  today: v.optional(v.picklist(["true", "false"])),
});

export const listMedicines = new Hono<MedicinesEnv>().get(
  "/",
  sValidator("query", ListMedicinesQuerySchema),
  async (c) => {
    const userId = c.get("userId");
    const { today } = c.req.valid("query");
    const db = createDbClient(c.env.DATABASE_URL);

    const userMedicines = await db
      .select({
        id: medicines.id,
        name: medicines.name,
        photoUrl: medicines.photoUrl,
      })
      .from(medicines)
      .where(eq(medicines.userId, userId));

    if (userMedicines.length === 0) {
      return c.json([]);
    }
    const medicineIds = userMedicines.map((medicine) => medicine.id);

    const timings = await db
      .select({ medicineId: medicineTimings.medicineId, timing: medicineTimings.timing })
      .from(medicineTimings)
      .where(inArray(medicineTimings.medicineId, medicineIds));

    const timingsByMedicine = new Map<string, Timing[]>();
    for (const t of timings) {
      const arr = timingsByMedicine.get(t.medicineId) ?? [];
      arr.push(t.timing);
      timingsByMedicine.set(t.medicineId, arr);
    }

    if (today !== "true") {
      return c.json(
        userMedicines.map((medicine) => ({
          id: medicine.id,
          name: medicine.name,
          photo_url: medicine.photoUrl,
          timings: timingsByMedicine.get(medicine.id) ?? [],
        })),
      );
    }

    const { start, end } = getJstTodayRange();
    const logs = await db
      .select({
        id: medicationLogs.id,
        medicineId: medicationLogs.medicineId,
        timing: medicationLogs.timing,
        isTaken: medicationLogs.isTaken,
        recordedAt: medicationLogs.recordedAt,
      })
      .from(medicationLogs)
      .where(
        and(
          inArray(medicationLogs.medicineId, medicineIds),
          gte(medicationLogs.recordedAt, start),
          lt(medicationLogs.recordedAt, end),
        ),
      )
      .orderBy(desc(medicationLogs.recordedAt));

    // recordedAt 降順で見て最初に見つかったものを採用（同 medicine × timing で最新を採用）
    const todayLogsByMedicine = new Map<
      string,
      Record<Timing, { log_id: string; is_taken: boolean }>
    >();
    for (const log of logs) {
      const bucket =
        todayLogsByMedicine.get(log.medicineId) ??
        ({} as Record<Timing, { log_id: string; is_taken: boolean }>);
      if (!bucket[log.timing]) {
        bucket[log.timing] = { log_id: log.id, is_taken: log.isTaken };
        todayLogsByMedicine.set(log.medicineId, bucket);
      }
    }

    return c.json(
      userMedicines.map((medicine) => ({
        id: medicine.id,
        name: medicine.name,
        photo_url: medicine.photoUrl,
        timings: timingsByMedicine.get(medicine.id) ?? [],
        today_logs: todayLogsByMedicine.get(medicine.id) ?? {},
      })),
    );
  },
);
