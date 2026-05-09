import { sql } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { notificationSettings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export interface UpdateNotificationSettingItem {
  timing: Timing;
  notifyTime: string;
  isEnabled: boolean;
}

export interface UpdateNotificationSettingsParams {
  userId: string;
  items: UpdateNotificationSettingItem[];
}

export interface UpdateNotificationSettingsResult {
  updated: number;
}

/**
 * 指定ユーザーの通知設定を timing 単位で upsert する。
 * 既存行があれば notify_time / is_enabled を更新し、無ければ新規作成する。
 * @param db Drizzle クライアント
 * @param params userId と更新対象の通知設定リスト (timing は一意)
 * @returns upsert された件数
 */
export const updateNotificationSettings = async (
  db: Db,
  params: UpdateNotificationSettingsParams,
): Promise<UpdateNotificationSettingsResult> => {
  if (params.items.length === 0) {
    return { updated: 0 };
  }

  const rows = params.items.map((item) => ({
    userId: params.userId,
    timing: item.timing,
    notifyTime: item.notifyTime,
    isEnabled: item.isEnabled,
  }));

  const inserted = await db
    .insert(notificationSettings)
    .values(rows)
    .onConflictDoUpdate({
      target: [notificationSettings.userId, notificationSettings.timing],
      set: {
        notifyTime: sql`excluded."notify_time"`,
        isEnabled: sql`excluded."is_enabled"`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: notificationSettings.id });

  return { updated: inserted.length };
};
