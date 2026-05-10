import { Hono } from "hono";

import type { AppEnv } from "../../types/index.js";
import { authMiddleware } from "../../utils/auth.js";
import { listNotificationSettingsRoute } from "./list.js";
import { updateNotificationSettingsRoute } from "./update.js";

export const notificationSettingsRoute = new Hono<AppEnv>();

notificationSettingsRoute.use("*", authMiddleware());

notificationSettingsRoute.route("/", listNotificationSettingsRoute);
notificationSettingsRoute.route("/", updateNotificationSettingsRoute);
