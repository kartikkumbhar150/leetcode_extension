// ============================================================
// api-client.ts — Centralized API fetch wrapper
// Attaches JWT to every request.
// Works in both Chrome Extension and web/Vercel.
// ============================================================

import { getToken } from "./storage-adapter";

// In production this will be your Vercel URL.
// During local dev it proxies through Vite (see vite.config.web.ts).
const API_BASE: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (import.meta as any).env?.VITE_API_URL || "/api";
  } catch {
    return "/api";
  }
})();

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as { error: string }).error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  signup: (email: string, password: string, username?: string) =>
    request<{ token: string; user: { id: number; email: string; username: string } }>(
      "POST", "/auth/signup", { email, password, username }
    ),

  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string; username: string } }>(
      "POST", "/auth/login", { email, password }
    ),

  me: () =>
    request<{ user: { id: number; email: string; username: string } }>(
      "GET", "/auth/me"
    ),
};

// ─── Problems ─────────────────────────────────────────────────
export const problemsApi = {
  getAll: () =>
    request<{ problems: Record<string, unknown> }>("GET", "/problems"),

  upsert: (problem: unknown) =>
    request<{ ok: boolean }>("POST", "/problems", problem),
};

// ─── Revisions ────────────────────────────────────────────────
export const revisionsApi = {
  getAll: () =>
    request<{ revisions: Record<string, unknown> }>("GET", "/revisions"),

  upsert: (revision: unknown) =>
    request<{ ok: boolean }>("POST", "/revisions", revision),
};

// ─── Journals ─────────────────────────────────────────────────
export const journalsApi = {
  getAll: () =>
    request<{ journals: Record<string, unknown> }>("GET", "/journals"),

  upsert: (journal: unknown) =>
    request<{ ok: boolean }>("POST", "/journals", journal),
};

// ─── Settings ─────────────────────────────────────────────────
export const settingsApi = {
  get: () =>
    request<{ settings: unknown }>("GET", "/settings"),

  update: (settings: unknown) =>
    request<{ ok: boolean }>("PUT", "/settings", settings),
};
