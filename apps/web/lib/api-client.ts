import "server-only";

import { issueApiToken } from "./api-jwt";

interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const _baseUrl = () => {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set");
  return url;
};

const _request = async <T>(
  path: string,
  init: { method: string; body?: unknown } = { method: "GET" },
): Promise<T> => {
  const token = await issueApiToken();
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "未ログインのため API を呼び出せません");

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${_baseUrl()}/api${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "INTERNAL_ERROR",
      body?.error?.message ?? `API request failed with status ${res.status}`,
    );
  }

  return (await res.json()) as T;
};

export const apiGet = <T>(path: string) => _request<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body: unknown) =>
  _request<T>(path, { method: "POST", body });

export const apiPut = <T>(path: string, body: unknown) =>
  _request<T>(path, { method: "PUT", body });

export const apiPatch = <T>(path: string, body: unknown) =>
  _request<T>(path, { method: "PATCH", body });

export const apiDelete = (path: string) => _request<void>(path, { method: "DELETE" });
