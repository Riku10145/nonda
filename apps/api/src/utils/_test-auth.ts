import { SignJWT } from "jose";

import type { Bindings } from "../types/index.js";

const TEST_AUTH_SECRET = "test-secret-do-not-use-in-production";

export const testEnv: Bindings = {
  DATABASE_URL: "postgres://test",
  FRONTEND_URL: "http://localhost:3000",
  AUTH_SECRET: TEST_AUTH_SECRET,
};

export const signTestToken = async (userId: string): Promise<string> => {
  const secret = new TextEncoder().encode(TEST_AUTH_SECRET);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("5m")
    .sign(secret);
};

export const authHeader = async (userId: string): Promise<Record<string, string>> => ({
  Authorization: `Bearer ${await signTestToken(userId)}`,
});
