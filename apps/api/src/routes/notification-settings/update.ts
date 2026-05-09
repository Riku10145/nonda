import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { UpdateNotificationSettingsSchema } from "../../schemas/notification-settings/index.js";
import { updateNotificationSettings } from "../../services/notification-settings/index.js";
import type { AppEnv } from "../../types/index.js";
import { validator } from "../../utils/validator.js";

export const updateNotificationSettingsRoute = new Hono<AppEnv>().put(
  "/",
  validator("json", UpdateNotificationSettingsSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const db = createDbClient(c.env.DATABASE_URL);
    const { updated } = await updateNotificationSettings(db, {
      userId,
      items: body.map((item) => ({
        timing: item.timing,
        notifyTime: item.notify_time,
        isEnabled: item.is_enabled,
      })),
    });

    return c.json({ updated });
  },
);
