import { eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicineTimings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export const _uniqueTimings = (timings: Timing[]): Timing[] => [...new Set(timings)];

export const _selectTimings = async (db: Db, medicineId: string): Promise<Timing[]> => {
  const rows = await db
    .select({ timing: medicineTimings.timing })
    .from(medicineTimings)
    .where(eq(medicineTimings.medicineId, medicineId));
  return rows.map((row) => row.timing);
};

export const _insertTimings = (db: Db, medicineId: string, timings: Timing[]) =>
  db.insert(medicineTimings).values(timings.map((timing) => ({ medicineId, timing })));
