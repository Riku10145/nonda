import "server-only";

import { SignJWT } from "jose";

import { auth } from "@/auth";

const TOKEN_EXPIRY = "5m";

/**
 * Auth.js のセッションから userId を取り出し、Hono API への認証用 JWT (HS256) を発行する。
 *
 * - payload: `{ sub: <users.id> }`
 * - 署名鍵: `AUTH_SECRET`（API 側と共有）
 * - 有効期限: 5 分
 *
 * 未ログインの場合は null を返す。
 */
export const issueApiToken = async (): Promise<string | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
};
