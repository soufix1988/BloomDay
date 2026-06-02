/**
 * Bloom storage layer — the "memory navigator".
 *
 * Every tool reads & writes its data through this single module. Today it is
 * backed by the browser's localStorage. When we move to Supabase, ONLY the
 * internals of this file (and the useBloomState hook) need to change — every
 * tool keeps working untouched.
 */

const PREFIX = "bloom:";

export function readKey<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeKey<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    // Notify listeners in this tab (storage event only fires in other tabs).
    window.dispatchEvent(new CustomEvent("bloom:storage", { detail: { key } }));
  } catch {
    /* quota or serialization error — ignore for now */
  }
}

export function storageKey(key: string): string {
  return PREFIX + key;
}
