import { Hono } from "hono";

import type { AppEnv } from "../../types/index.js";
import { authMiddleware } from "../../utils/auth.js";
import { createMedicineRoute } from "./create.js";
import { deleteMedicineRoute } from "./delete.js";
import { getMedicineRoute } from "./get.js";
import { listMedicinesRoute } from "./list.js";
import { updateMedicineRoute } from "./update.js";

export const medicinesRoute = new Hono<AppEnv>();

medicinesRoute.use("*", authMiddleware());

medicinesRoute.route("/", listMedicinesRoute);
medicinesRoute.route("/", createMedicineRoute);
medicinesRoute.route("/", getMedicineRoute);
medicinesRoute.route("/", deleteMedicineRoute);
medicinesRoute.route("/", updateMedicineRoute);
