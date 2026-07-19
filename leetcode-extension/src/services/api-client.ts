// ============================================================
// api-client.ts — Centralized API fetch wrapper
// Attaches JWT to every request.
// Works in both Chrome Extension and web/Vercel.
// ============================================================

import { getToken } from "./storage-adapter";

// Detect if we're inside a Chrome extension (popup/dashboard/background)
const IS_EXTENSION =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  typeof chrome.runtime.id === "string";

// In the extension, we MUST use an absolute URL since relative /api
// would resolve to chrome-extension://ID/api which doesn't exist.
// In the web dashboard (Vercel), relative /api works fine.
const API_BASE: string = (() => {
  // Check for build-time env var first (set via Vite define)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl;
  } catch {
    // ignore — not in Vite context
  }

  // Extension must use absolute URL
  if (IS_EXTENSION) {
    // Points to your Vercel deployment — update this after deploying!
    return "https://leetcode-extension.vercel.app/api";
  }

  // Web dashboard uses relative path (Vite proxy or Vercel rewrites handle it)
  return "/api";
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
