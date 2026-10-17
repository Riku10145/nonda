import type { Db } from "../../db/client.js";
import { medicines } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";
import { _insertTimings, _uniqueTimings } from "./_timings.js";

export interface CreateMedicineParams {
  userId: string;
  name: string;
  timings: Timing[];
}

export interface CreatedMedicine {
  id: string;
  name: string;
  timings: Timing[];
  createdAt: Date;
}

/**
 * 薬を新規登録し、指定タイミングを紐付ける。
 * @param db Drizzle クライアント
 * @param params 登録内容（タイミングは重複除去して保存）
 * @returns 作成された薬と保存されたタイミング配列
 */
export const createMedicine = async (
  db: Db,
  params: CreateMedicineParams,
): Promise<CreatedMedicine> => {
  const uniqueTimings = _uniqueTimings(params.timings);
  const medicineId = crypto.randomUUID();

  const [[inserted]] = await db.batch([
    db
      .insert(medicines)
      .values({
        id: medicineId,
        userId: params.userId,
        name: params.name,
      })
      .returning(),
    _insertTimings(db, medicineId, uniqueTimings),
  ]);

  return {
    id: inserted.id,
    name: inserted.name,
    timings: uniqueTimings,
    createdAt: inserted.createdAt,
  };
};
