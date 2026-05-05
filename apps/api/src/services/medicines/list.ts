import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { medicationLogs, medicines, medicineTimings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";
import { getJstTodayRange } from "../../utils/jst.js";

export interface MedicineSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  timings: Timing[];
}

export interface TodayLog {
  logId: string;
  isTaken: boolean;
}

export interface MedicineWithTodayLogs extends MedicineSummary {
  todayLogs: Partial<Record<Timing, TodayLog>>;
}

/**
 * ユーザーの薬一覧を、各タイミング込みで取得する。
 * @param db Drizzle クライアント
 * @param userId 対象ユーザー ID
 * @returns 作成日時降順の薬一覧
 */
export const listMedicines = async (db: Db, userId: string): Promise<MedicineSummary[]> => {
  const userMedicines = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      photoUrl: medicines.photoUrl,
    })
    .from(medicines)
    .where(eq(medicines.userId, userId))
    .orderBy(desc(medicines.createdAt), medicines.id);

  if (userMedicines.length === 0) {
    return [];
  }

  const medicineIds = userMedicines.map((medicine) => medicine.id);
  const timingsByMedicine = await _fetchTimingsByMedicine(db, medicineIds);

  return userMedicines.map((medicine) => ({
    ...medicine,
    timings: timingsByMedicine.get(medicine.id) ?? [],
  }));
};

/**
 * 薬一覧に「今日の服用ログ」を併せて取得する。
 * @param db Drizzle クライアント
 * @param userId 対象ユーザー ID
 * @returns 各薬と当日 (JST) のタイミング別ログ
 */
export const listMedicinesWithTodayLogs = async (
  db: Db,
  userId: string,
): Promise<MedicineWithTodayLogs[]> => {
  const summaries = await listMedicines(db, userId);
  if (summaries.length === 0) {
    return [];
  }

  const medicineIds = summaries.map((medicine) => medicine.id);
  const todayLogsByMedicine = await _fetchTodayLogsByMedicine(db, medicineIds);

  return summaries.map((medicine) => ({
    ...medicine,
    todayLogs: todayLogsByMedicine.get(medicine.id) ?? {},
  }));
};

const _fetchTimingsByMedicine = async (
  db: Db,
  medicineIds: string[],
): Promise<Map<string, Timing[]>> => {
  const rows = await db
    .select({ medicineId: medicineTimings.medicineId, timing: medicineTimings.timing })
    .from(medicineTimings)
    .where(inArray(medicineTimings.medicineId, medicineIds));

  const map = new Map<string, Timing[]>();
  for (const row of rows) {
    const arr = map.get(row.medicineId) ?? [];
    arr.push(row.timing);
    map.set(row.medicineId, arr);
  }
  return map;
};

const _fetchTodayLogsByMedicine = async (
  db: Db,
  medicineIds: string[],
): Promise<Map<string, Partial<Record<Timing, TodayLog>>>> => {
  const { start, end } = getJstTodayRange();
  const rows = await db
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
  const map = new Map<string, Partial<Record<Timing, TodayLog>>>();
  for (const row of rows) {
    const bucket = map.get(row.medicineId) ?? {};
    if (!bucket[row.timing]) {
      bucket[row.timing] = { logId: row.id, isTaken: row.isTaken };
      map.set(row.medicineId, bucket);
    }
  }
  return map;
};
