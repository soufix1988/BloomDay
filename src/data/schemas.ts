/**
 * Central data shapes + storage keys shared by tools and the dashboard.
 * Keeping these in one place means the Dashboard reads exactly what each
 * tool writes — and makes the future Supabase schema obvious.
 */
import { addDays, dayKey, daysBetween, fromDayKey } from "@/lib/date";

/* ---------------- Storage keys ---------------- */
export const KEYS = {
  waterLog: "water:log", // Record<dayKey, number>
  waterGoal: "water:goal", // number
  moodEntries: "mood:entries", // Record<dayKey, MoodEntry>
  habits: "habits:list", // Habit[]
  journal: "journal:entries", // JournalEntry[]
  budget: "budget:transactions", // Transaction[]
  periodStarts: "period:starts", // string[] (dayKeys)
  periodSettings: "period:settings", // PeriodSettings
  tasks: "planner:tasks", // Task[]
  goals: "goals:list", // Goal[]
} as const;

/* ---------------- Types ---------------- */
export interface MoodEntry {
  mood: number; // 1..5
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  history: Record<string, boolean>; // dayKey -> done
}

export interface JournalEntry {
  id: string;
  date: string; // dayKey
  title: string;
  body: string;
  mood: number; // 1..5
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string; // dayKey
}

export interface PeriodSettings {
  cycleLength: number;
  periodLength: number;
}

export interface Task {
  id: string;
  title: string;
  date: string; // dayKey
  done: boolean;
  priority: "low" | "med" | "high";
}

export interface Goal {
  id: string;
  title: string;
  emoji: string;
  current: number;
  target: number;
  unit: string;
  deadline?: string; // dayKey
}

/* ---------------- Shared pure helpers ---------------- */

export const MOODS = [
  { value: 1, emoji: "😢", label: "Awful", color: "#94a3b8" },
  { value: 2, emoji: "😟", label: "Low", color: "#60a5fa" },
  { value: 3, emoji: "😐", label: "Okay", color: "#fbbf24" },
  { value: 4, emoji: "🙂", label: "Good", color: "#34d399" },
  { value: 5, emoji: "😄", label: "Great", color: "#f472b6" },
] as const;

/** Current streak of consecutive done-days ending today (or yesterday). */
export function currentStreak(history: Record<string, boolean>): number {
  let streak = 0;
  let cursor = new Date();
  // allow streak to count even if today not yet done, starting from yesterday
  if (!history[dayKey(cursor)]) cursor = addDays(cursor, -1);
  while (history[dayKey(cursor)]) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface CyclePrediction {
  hasData: boolean;
  cycleDay: number;
  nextPeriod?: Date;
  daysUntilNext?: number;
  ovulation?: Date;
  fertileStart?: Date;
  fertileEnd?: Date;
  phase: string;
}

export function predictCycle(
  starts: string[],
  settings: PeriodSettings,
): CyclePrediction {
  if (starts.length === 0) {
    return { hasData: false, cycleDay: 0, phase: "—" };
  }
  const sorted = [...starts].sort();
  const lastStart = fromDayKey(sorted[sorted.length - 1]);

  // Estimate cycle length from history if we have 2+ periods.
  let cycleLength = settings.cycleLength;
  if (sorted.length >= 2) {
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      diffs.push(daysBetween(fromDayKey(sorted[i - 1]), fromDayKey(sorted[i])));
    }
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avg > 15 && avg < 45) cycleLength = Math.round(avg);
  }

  const cycleDay = daysBetween(lastStart, new Date()) + 1;
  const nextPeriod = addDays(lastStart, cycleLength);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const daysUntilNext = daysBetween(new Date(), nextPeriod);

  let phase = "Follicular";
  if (cycleDay <= settings.periodLength) phase = "Menstrual";
  else if (new Date() >= fertileStart && new Date() <= fertileEnd)
    phase = "Fertile window";
  else if (daysUntilNext <= 5) phase = "Luteal (PMS)";

  return {
    hasData: true,
    cycleDay,
    nextPeriod,
    daysUntilNext,
    ovulation,
    fertileStart,
    fertileEnd,
    phase,
  };
}
