import { and, eq, inArray } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicationLogs, medicines } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export interface CreateMedicationLogInput {
  medicineId: string;
  timing: Timing;
  isTaken: boolean;
}

export interface CreateMedicationLogsParams {
  userId: string;
  logs: CreateMedicationLogInput[];
  recordedAt: Date;
}

export type CreateMedicationLogsResult = { created: number } | { forbidden: true };

/**
 * 服用ログを一括登録する。
 * 指定された medicine_id がすべて userId の所有か検証し、所有外があれば `{ forbidden: true }` を返す。
 * 登録は単一の INSERT で原子的に行う。
 * @param db Drizzle クライアント
 * @param params 登録内容（logs は 1 件以上、recordedAt は全件共通）
 * @returns 作成件数、所有外があれば `{ forbidden: true }`
 */
export const createMedicationLogs = async (
  db: Db,
  params: CreateMedicationLogsParams,
): Promise<CreateMedicationLogsResult> => {
  const medicineIds = [...new Set(params.logs.map((log) => log.medicineId))];

  const owned = await db
    .select({ id: medicines.id })
    .from(medicines)
    .where(and(eq(medicines.userId, params.userId), inArray(medicines.id, medicineIds)));

  if (owned.length !== medicineIds.length) {
    return { forbidden: true };
  }

  await db.insert(medicationLogs).values(
    params.logs.map((log) => ({
      medicineId: log.medicineId,
      timing: log.timing,
      recordedAt: params.recordedAt,
      isTaken: log.isTaken,
    })),
  );

  return { created: params.logs.length };
};
