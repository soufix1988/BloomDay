/** Shared date helpers used across Bloom tools. All day-keys are "yyyy-MM-dd". */

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = fromDayKey(dayKey(b)).getTime() - fromDayKey(dayKey(a)).getTime();
  return Math.round(ms / 86_400_000);
}

export function prettyDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isToday(key: string): boolean {
  return key === dayKey();
}

/** Last `n` day-keys ending today, oldest first. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(addDays(today, -i)));
  return out;
}
