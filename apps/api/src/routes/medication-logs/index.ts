import { Hono } from "hono";

import type { AppEnv } from "../../types/index.js";
import { authMiddleware } from "../../utils/auth.js";
import { createMedicationLogsRoute } from "./create.js";
import { listMedicationLogsRoute } from "./list.js";
import { updateMedicationLogRoute } from "./update.js";

export const medicationLogsRoute = new Hono<AppEnv>();

medicationLogsRoute.use("*", authMiddleware());

medicationLogsRoute.route("/", createMedicationLogsRoute);
medicationLogsRoute.route("/", listMedicationLogsRoute);
medicationLogsRoute.route("/", updateMedicationLogRoute);
