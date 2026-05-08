import { and, eq } from "drizzle-orm";

import type { Db } from "../../db/client.js";
import { notificationSettings } from "../../db/schema.js";
import type { Timing } from "../../schemas/medicines/timing.js";

export interface NotificationSettingItem {
  id: string | null;
  timing: Timing;
  notifyTime: string;
  isEnabled: boolean;
}

export interface ListNotificationSettingsParams {
  userId: string;
}

const _DEFAULT_NOTIFY_TIMES = {
  morning: "08:00",
  afternoon: "12:00",
  evening: "21:00",
} as const satisfies Record<Timing, string>;

const _TIMING_ORDER: readonly Timing[] = ["morning", "afternoon", "evening"];

const _normalizeTime = (value: string): string => value.slice(0, 5);

/**
 * 指定ユーザーの通知設定を朝/昼/夕の固定順で返す。
 * 未登録のタイミングはデフォルト時刻 (08:00 / 12:00 / 21:00) と is_enabled=true で補完し、
 * `id` は null を返す。
 * @param db Drizzle クライアント
 * @param params 取得対象の userId
 * @returns morning -> afternoon -> evening の順に並んだ通知設定（必ず3件）
 */
export const listNotificationSettings = async (
  db: Db,
  params: ListNotificationSettingsParams,
): Promise<NotificationSettingItem[]> => {
  const rows = await db
    .select({
      id: notificationSettings.id,
      timing: notificationSettings.timing,
      notifyTime: notificationSettings.notifyTime,
      isEnabled: notificationSettings.isEnabled,
    })
    .from(notificationSettings)
    .where(and(eq(notificationSettings.userId, params.userId)));

  const byTiming = new Map(rows.map((row) => [row.timing, row]));

  return _TIMING_ORDER.map<NotificationSettingItem>((timing) => {
    const row = byTiming.get(timing);
    if (row) {
      return {
        id: row.id,
        timing,
        notifyTime: _normalizeTime(row.notifyTime),
        isEnabled: row.isEnabled,
      };
    }
    return {
      id: null,
      timing,
      notifyTime: _DEFAULT_NOTIFY_TIMES[timing],
      isEnabled: true,
    };
  });
};
