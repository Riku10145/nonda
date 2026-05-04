import { Hono } from "hono";

import { medicinesRoute } from "./medicines.js";

type Bindings = {
  DATABASE_URL: string;
  FRONTEND_URL: string;
};

export const routes = new Hono<{ Bindings: Bindings }>();

routes.get("/", (c) => c.json({ message: "nonda API" }));

routes.route("/v1/medicines", medicinesRoute);
