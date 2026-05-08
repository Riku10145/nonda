import { Hono } from "hono";

import { createDbClient } from "../../db/client.js";
import { listNotificationSettings } from "../../services/notification-settings/index.js";
import type { AppEnv } from "../../types/index.js";

export const listNotificationSettingsRoute = new Hono<AppEnv>().get("/", async (c) => {
  const userId = c.get("userId");
  const db = createDbClient(c.env.DATABASE_URL);

  const settings = await listNotificationSettings(db, { userId });
  return c.json(
    settings.map((setting) => ({
      id: setting.id,
      timing: setting.timing,
      notify_time: setting.notifyTime,
      is_enabled: setting.isEnabled,
    })),
  );
});
