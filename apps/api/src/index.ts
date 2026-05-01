import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { routes } from "./routes/index.js";

type Bindings = {
  DATABASE_URL: string;
  FRONTEND_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
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
