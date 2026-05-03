import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { routes } from "./routes/index.js";

type Bindings = {
  DATABASE_URL: string;
  FRONTEND_URL: string;
};

const REQUIRED_ENV_KEYS = ["DATABASE_URL", "FRONTEND_URL"] as const satisfies ReadonlyArray<
  keyof Bindings
>;

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("*", async (c, next) => {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !c.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Server misconfigured" } }, 500);
  }
  await next();
});
app.use(trimTrailingSlash());
app.use("/api/*", (c, next) =>
  cors({
    origin: c.env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })(c, next),
);

app.route("/api", routes);

app.get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;

export default app;
