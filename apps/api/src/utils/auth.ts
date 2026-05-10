import type { MiddlewareHandler } from "hono";
import { jwtVerify } from "jose";

import type { AppEnv } from "../types/index.js";

import { UUID_REGEX } from "./uuid.js";

const BEARER_PREFIX = "Bearer ";

const _unauthorized = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) =>
  c.json({ error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }, 401);

/**
 * Web (Next.js) 側で `jose` が HS256 で署名した短命 JWT を検証し、`userId` を
 * Hono コンテキストに格納するミドルウェア。
 *
 * - Authorization: Bearer <jwt>
 * - 署名鍵は `AUTH_SECRET`（Web と共有）
 * - 期待する payload: `{ sub: <users.id> }`
 */
export const authMiddleware = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith(BEARER_PREFIX)) {
    return _unauthorized(c);
  }
  const token = authorization.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    return _unauthorized(c);
  }

  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = payload.sub;
    if (!userId || !UUID_REGEX.test(userId)) {
      return _unauthorized(c);
    }
    c.set("userId", userId);
  } catch {
    return _unauthorized(c);
  }

  await next();
};
