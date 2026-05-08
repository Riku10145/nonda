import { Hono } from "hono";

import type { Bindings } from "../types/index.js";
import { medicationLogsRoute } from "./medication-logs/index.js";
import { medicinesRoute } from "./medicines/index.js";
import { notificationSettingsRoute } from "./notification-settings/index.js";

export const routes = new Hono<{ Bindings: Bindings }>();

routes.get("/", (c) => c.json({ message: "nonda API" }));

routes.route("/v1/medicines", medicinesRoute);
routes.route("/v1/medication-logs", medicationLogsRoute);
routes.route("/v1/notification-settings", notificationSettingsRoute);
