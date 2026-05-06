import { eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicationLogs, medicines } from "../../db/schema.js";

export interface UpdateMedicationLogParams {
  userId: string;
  logId: string;
  isTaken: boolean;
}

export interface UpdatedMedicationLog {
  id: string;
  isTaken: boolean;
  updatedAt: Date;
}

export type UpdateMedicationLogResult =
  | { updated: UpdatedMedicationLog }
  | { notFound: true }
  | { forbidden: true };

/**
 * 服用ログの is_taken を部分更新する。
 * 対象 log の medicine が userId の所有でなければ `{ forbidden: true }`、
 * 存在しなければ `{ notFound: true }` を返す。
 * @param db Drizzle クライアント
 * @param params 更新対象の logId / 所有 userId / 新しい isTaken
 * @returns 更新後の log、所有外なら forbidden、未存在なら notFound
 */
export const updateMedicationLog = async (
  db: Db,
  params: UpdateMedicationLogParams,
): Promise<UpdateMedicationLogResult> => {
  const [target] = await db
    .select({ id: medicationLogs.id, ownerId: medicines.userId })
    .from(medicationLogs)
    .innerJoin(medicines, eq(medicationLogs.medicineId, medicines.id))
    .where(eq(medicationLogs.id, params.logId))
    .limit(1);

  if (!target) {
    return { notFound: true };
  }

  if (target.ownerId !== params.userId) {
    return { forbidden: true };
  }

  const [updated] = await db
    .update(medicationLogs)
    .set({ isTaken: params.isTaken, updatedAt: new Date() })
    .where(eq(medicationLogs.id, params.logId))
    .returning({
      id: medicationLogs.id,
      isTaken: medicationLogs.isTaken,
      updatedAt: medicationLogs.updatedAt,
    });

  return { updated };
};
