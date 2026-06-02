import { useCallback, useEffect, useState } from "react";
import { readKey, storageKey, writeKey } from "@/lib/storage";

/**
 * Stateful binding to a persisted Bloom value. Same ergonomics as useState,
 * but the value is persisted via the storage layer and synced across tabs.
 *
 *   const [moods, setMoods] = useBloomState<MoodEntry[]>("mood:entries", []);
 *
 * Swapping to Supabase later means rewriting this hook's body only.
 */
export function useBloomState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readKey(key, initial));

  // Keep in sync when the same key changes elsewhere (other tab or component).
  useEffect(() => {
    const sync = () => setValue(readKey(key, initial));
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail?.key === key) sync();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(key)) sync();
    };
    window.addEventListener("bloom:storage", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bloom:storage", onCustom);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeKey(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
