import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { routes } from "./routes/index.js";

const app = new Hono();

app.use("*", logger());
app.use(trimTrailingSlash());
app.use(
  "/api/*",
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.route("/api", routes);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 8080;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export type AppType = typeof app;
