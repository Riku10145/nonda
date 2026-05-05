import { and, eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicines, medicineTimings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export interface MedicineDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  timings: Timing[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * userId スコープで薬を1件取得する。他ユーザーの薬や存在しない id は null を返す。
 * @param db Drizzle クライアント
 * @param params 取得対象の medicineId と所有 userId
 * @returns 該当薬（タイミング込み）、無ければ null
 */
export const findMedicineById = async (
  db: Db,
  params: { userId: string; medicineId: string },
): Promise<MedicineDetail | null> => {
  const [medicine] = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      photoUrl: medicines.photoUrl,
      createdAt: medicines.createdAt,
      updatedAt: medicines.updatedAt,
    })
    .from(medicines)
    .where(and(eq(medicines.id, params.medicineId), eq(medicines.userId, params.userId)))
    .limit(1);

  if (!medicine) {
    return null;
  }

  const timingRows = await db
    .select({ timing: medicineTimings.timing })
    .from(medicineTimings)
    .where(eq(medicineTimings.medicineId, medicine.id));

  return {
    ...medicine,
    timings: timingRows.map((row) => row.timing),
  };
};
