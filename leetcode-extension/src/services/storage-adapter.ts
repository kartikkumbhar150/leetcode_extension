// ============================================================
// storage-adapter.ts
// Transparent wrapper: uses chrome.storage.local inside the
// extension, and localStorage when running as a standalone
// web app (Vercel, dev server, etc.)
// ============================================================

const IS_EXTENSION =
  typeof chrome !== "undefined" &&
  typeof chrome.storage !== "undefined" &&
  typeof chrome.storage.local !== "undefined";

export async function adapterGet<T>(key: string, fallback: T): Promise<T> {
  if (IS_EXTENSION) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve((result[key] !== undefined ? result[key] : fallback) as T);
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}

export async function adapterSet<T>(key: string, value: T): Promise<void> {
  if (IS_EXTENSION) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
