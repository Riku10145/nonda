import { and, eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicines, medicineTimings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export interface UpdateMedicineParams {
  userId: string;
  medicineId: string;
  name?: string;
  timings?: Timing[];
  photoUrl?: string | null;
}

export interface UpdatedMedicine {
  id: string;
  name: string;
  timings: Timing[];
  photoUrl: string | null;
  updatedAt: Date;
}

/**
 * 薬を部分更新する。userId スコープ外や存在しない id は null を返す。
 * timings が指定された場合は既存タイミングを置き換える。
 * @param db Drizzle クライアント
 * @param params 更新内容（指定したフィールドのみ反映）
 * @returns 更新後の薬情報、所有外/未存在なら null
 */
export const updateMedicine = async (
  db: Db,
  params: UpdateMedicineParams,
): Promise<UpdatedMedicine | null> => {
  const [owned] = await db
    .select({ id: medicines.id })
    .from(medicines)
    .where(and(eq(medicines.id, params.medicineId), eq(medicines.userId, params.userId)))
    .limit(1);

  if (!owned) {
    return null;
  }

  const updateSet: { name?: string; photoUrl?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (params.name !== undefined) updateSet.name = params.name;
  if (params.photoUrl !== undefined) updateSet.photoUrl = params.photoUrl;

  if (params.timings !== undefined) {
    const uniqueTimings = [...new Set(params.timings)];
    const [[updated]] = await db.batch([
      db.update(medicines).set(updateSet).where(eq(medicines.id, params.medicineId)).returning(),
      db.delete(medicineTimings).where(eq(medicineTimings.medicineId, params.medicineId)),
      db.insert(medicineTimings).values(
        uniqueTimings.map((timing) => ({
          medicineId: params.medicineId,
          timing,
        })),
      ),
    ]);

    return {
      id: updated.id,
      name: updated.name,
      photoUrl: updated.photoUrl,
      timings: uniqueTimings,
      updatedAt: updated.updatedAt,
    };
  }

  const [updated] = await db
    .update(medicines)
    .set(updateSet)
    .where(eq(medicines.id, params.medicineId))
    .returning();

  const timingRows = await db
    .select({ timing: medicineTimings.timing })
    .from(medicineTimings)
    .where(eq(medicineTimings.medicineId, params.medicineId));

  return {
    id: updated.id,
    name: updated.name,
    photoUrl: updated.photoUrl,
    timings: timingRows.map((row) => row.timing),
    updatedAt: updated.updatedAt,
  };
};
