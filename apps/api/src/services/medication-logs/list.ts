import { and, asc, eq, gte, lt } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicationLogs, medicines } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";
import { jstDateStringToUtc, utcToJstDateString } from "../../utils/jst.js";

export interface MedicationLogItem {
  id: string;
  medicineName: string;
  timing: Timing;
  isTaken: boolean;
  recordedAt: Date;
}

export interface MedicationLogGroup {
  date: string;
  logs: MedicationLogItem[];
}

export interface ListMedicationLogsParams {
  userId: string;
  from: string;
  to: string;
}

const _ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 指定ユーザー所有の薬に紐づく服用ログを、JST 基準の日付ごとにグループ化して返す。
 * 期間は JST [from 00:00, to 24:00) （両端含む from / to の日）として扱う。
 * @param db Drizzle クライアント
 * @param params userId と JST 日付 "YYYY-MM-DD" の from / to
 * @returns date 降順の日次グループ。各 logs は recordedAt 昇順。記録のない日は含まない
 */
export const listMedicationLogs = async (
  db: Db,
  params: ListMedicationLogsParams,
): Promise<MedicationLogGroup[]> => {
  const start = jstDateStringToUtc(params.from);
  const end = new Date(jstDateStringToUtc(params.to).getTime() + _ONE_DAY_MS);

  const rows = await db
    .select({
      id: medicationLogs.id,
      medicineName: medicines.name,
      timing: medicationLogs.timing,
      isTaken: medicationLogs.isTaken,
      recordedAt: medicationLogs.recordedAt,
    })
    .from(medicationLogs)
    .innerJoin(medicines, eq(medicationLogs.medicineId, medicines.id))
    .where(
      and(
        eq(medicines.userId, params.userId),
        gte(medicationLogs.recordedAt, start),
        lt(medicationLogs.recordedAt, end),
      ),
    )
    .orderBy(asc(medicationLogs.recordedAt));

  const groups = new Map<string, MedicationLogItem[]>();
  for (const row of rows) {
    const date = utcToJstDateString(row.recordedAt);
    const bucket = groups.get(date) ?? [];
    bucket.push(row);
    groups.set(date, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, logs]) => ({ date, logs }));
};
