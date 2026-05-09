import * as v from "valibot";

import { TimingSchema } from "../medicines/timing.js";

const _NOTIFY_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const _NotificationSettingItemSchema = v.object({
  timing: TimingSchema,
  notify_time: v.pipe(
    v.string(),
    v.regex(_NOTIFY_TIME_REGEX, "notify_time は HH:MM 形式で指定してください"),
  ),
  is_enabled: v.boolean(),
});

/** PUT /v1/notification-settings のリクエストボディ。timing は重複不可、最大3件 (morning/afternoon/evening)。 */
export const UpdateNotificationSettingsSchema = v.pipe(
  v.array(_NotificationSettingItemSchema),
  v.minLength(1, "通知設定は1件以上指定してください"),
  v.maxLength(3, "通知設定は最大3件まで指定できます"),
  v.check(
    (items) => new Set(items.map((item) => item.timing)).size === items.length,
    "timing が重複しています",
  ),
);

export type UpdateNotificationSettingsInput = v.InferOutput<
  typeof UpdateNotificationSettingsSchema
>;
