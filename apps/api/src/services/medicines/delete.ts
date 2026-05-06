import { and, eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicines } from "../../db/schema.js";

/**
 * userId スコープで薬を1件削除する。他ユーザーの薬や存在しない id は false を返す。
 * medicine_timings / medication_logs は ON DELETE CASCADE で連動削除される。
 * @param db Drizzle クライアント
 * @param params 削除対象の medicineId と所有 userId
 * @returns 削除に成功したら true、対象が存在しなければ false
 */
export const deleteMedicineById = async (
  db: Db,
  params: { userId: string; medicineId: string },
): Promise<boolean> => {
  const deleted = await db
    .delete(medicines)
    .where(and(eq(medicines.id, params.medicineId), eq(medicines.userId, params.userId)))
    .returning({ id: medicines.id });

  return deleted.length > 0;
};
