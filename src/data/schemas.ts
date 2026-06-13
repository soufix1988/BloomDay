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
  periodLogs: "period:logs", // Record<dayKey, CycleDayLog>
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

/** One day's logged symptoms for the Cycle tool. */
export interface CycleDayLog {
  flow?: "spotting" | "light" | "medium" | "heavy";
  mood?: string[];
  body?: string[];
  skin?: string;
  energy?: "low" | "medium" | "high";
  note?: string;
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

export type CyclePhaseKey = "menstrual" | "follicular" | "ovulatory" | "luteal";

export const PHASES: Record<CyclePhaseKey, { name: string; emoji: string; color: string; vibe: string }> = {
  menstrual:  { name: "Menstrual",  emoji: "🔴", color: "#ef7a6f", vibe: "Rest, inward, cozy" },
  follicular: { name: "Follicular", emoji: "🌱", color: "#7cc77c", vibe: "Energy rising, creative" },
  ovulatory:  { name: "Ovulatory",  emoji: "✨", color: "#f7c948", vibe: "Peak glow, social, confident" },
  luteal:     { name: "Luteal",     emoji: "🌙", color: "#a87ad8", vibe: "Wind down, introspective" },
};

export const PHASE_TIPS: Record<CyclePhaseKey, string[]> = {
  menstrual: [
    "Your iron is low today — eat spinach & dark chocolate 🍫",
    "Rest is productive. A slow day is a good day 🌷",
    "Gentle stretching can ease cramps better than staying still.",
  ],
  follicular: [
    "Great day to start a new habit — your brain is extra sharp 🧠",
    "Energy is rising — perfect time to plan ahead.",
    "Try a new workout or recipe, you're more open to new things now.",
  ],
  ovulatory: [
    "Schedule that important meeting — you're magnetic right now ✨",
    "Great day for a date, photoshoot, or big conversation.",
    "Your strength peaks today — go for that PR at the gym 💪",
  ],
  luteal: [
    "Cravings are normal — your body needs ~200 extra calories today.",
    "Be extra soft with yourself, your patience is naturally lower 💗",
    "Good day for cozy, low-key plans and tidying up.",
  ],
};

export interface CyclePrediction {
  hasData: boolean;
  cycleDay: number;
  nextPeriod?: Date;
  daysUntilNext?: number;
  ovulation?: Date;
  fertileStart?: Date;
  fertileEnd?: Date;
  phase: string;
  phaseKey: CyclePhaseKey;
}

/** Determine the cycle-phase key for a given cycle day (1-indexed). */
export function phaseForCycleDay(cycleDay: number, settings: PeriodSettings): CyclePhaseKey {
  const ovulationDay = settings.cycleLength - 14;
  const fertileStartDay = ovulationDay - 5;
  const fertileEndDay = ovulationDay + 1;
  if (cycleDay <= settings.periodLength) return "menstrual";
  if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) return "ovulatory";
  if (cycleDay < fertileStartDay) return "follicular";
  return "luteal";
}

export function predictCycle(
  starts: string[],
  settings: PeriodSettings,
): CyclePrediction {
  if (starts.length === 0) {
    return { hasData: false, cycleDay: 0, phase: "—", phaseKey: "follicular" };
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

  const rawCycleDay = daysBetween(lastStart, new Date()) + 1;
  // cycleDay wraps within [1, cycleLength] even if overdue
  const cycleDay = ((rawCycleDay - 1) % cycleLength) + 1;
  const nextPeriod = addDays(lastStart, cycleLength);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const daysUntilNext = daysBetween(new Date(), nextPeriod);

  const phaseKey = phaseForCycleDay(cycleDay, { ...settings, cycleLength });
  const phase = phaseKey === "ovulatory" ? "Fertile window"
    : phaseKey === "luteal" && daysUntilNext <= 5 ? "Luteal (PMS)"
    : PHASES[phaseKey].name;

  return {
    hasData: true,
    cycleDay,
    nextPeriod,
    daysUntilNext,
    ovulation,
    fertileStart,
    fertileEnd,
    phase,
    phaseKey,
  };
}
