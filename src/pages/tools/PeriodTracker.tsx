import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Settings2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import {
  KEYS,
  type PeriodSettings,
  type CycleDayLog,
  type MoodEntry,
} from "@/data/schemas";
import { dayKey, fromDayKey, daysBetween, addDays } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { SoftCard } from "@/components/common/Card";

// ── Phase config ──────────────────────────────────────────────────────────────

type PhaseName = "menstrual" | "follicular" | "ovulatory" | "luteal";

const PHASES: Record<
  PhaseName,
  { label: string; emoji: string; bg: string; accent: string; desc: string }
> = {
  menstrual:  { label: "Menstrual",  emoji: "🩸", bg: "#ffe4e6", accent: "#f43f5e", desc: "Flow & rest"   },
  follicular: { label: "Follicular", emoji: "🌱", bg: "#dcfce7", accent: "#16a34a", desc: "Rise & glow"   },
  ovulatory:  { label: "Ovulatory",  emoji: "🌸", bg: "#f3e8ff", accent: "#9333ea", desc: "Peak energy"   },
  luteal:     { label: "Luteal",     emoji: "🌙", bg: "#dbeafe", accent: "#2563eb", desc: "Wind down"     },
};

const PHASE_ORDER: PhaseName[] = ["menstrual", "follicular", "ovulatory", "luteal"];

const PHASE_WELLNESS: Record<
  PhaseName,
  { energy: string; workout: string; nutrition: string; ritual: string; affirmation: string }
> = {
  menstrual: {
    energy: "Low — honor your need for rest",
    workout: "Gentle yoga or light stretching",
    nutrition: "Iron-rich: spinach, lentils, dark chocolate",
    ritual: "Warm bath, heating pad, cozy blanket",
    affirmation: "I honor my body's natural rhythm 🌙",
  },
  follicular: {
    energy: "Rising — fresh ideas are blooming",
    workout: "Light cardio, dance, pilates",
    nutrition: "Probiotic: yogurt, kimchi, flaxseeds",
    ritual: "Try something new, journal your dreams",
    affirmation: "I am blooming with possibilities 🌱",
  },
  ovulatory: {
    energy: "Peak — you are radiant today",
    workout: "HIIT, strength training, running",
    nutrition: "Antioxidant-rich: berries, leafy greens",
    ritual: "Social plans, creative projects, speak up",
    affirmation: "I shine at my fullest brightness 🌸",
  },
  luteal: {
    energy: "Slowing — turn inward with kindness",
    workout: "Walking, gentle swimming, yin yoga",
    nutrition: "Magnesium-rich: nuts, seeds, dark chocolate",
    ritual: "Limit caffeine, mindful breathing, early rest",
    affirmation: "I release and make space for renewal 🌙",
  },
};

const SYMPTOMS = ["cramps", "bloating", "fatigue", "headache", "acne", "back pain", "mood swings"];
const FLOW = ["spotting", "light", "medium", "heavy"] as const;
const MOOD_EMOJIS = ["😢", "😟", "😐", "🙂", "😄"];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Pure helpers ──────────────────────────────────────────────────────────────

function calcCycleLength(starts: string[], settings: PeriodSettings): number {
  if (starts.length >= 2) {
    const sorted = [...starts].sort();
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++)
      diffs.push(daysBetween(fromDayKey(sorted[i - 1]), fromDayKey(sorted[i])));
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avg > 15 && avg < 45) return Math.round(avg);
  }
  return settings.cycleLength;
}

function cyclePhaseForDay(cycleDay: number, settings: PeriodSettings, cl: number): PhaseName {
  const ovulationDay = cl - 14;
  const fertileStart = Math.max(settings.periodLength + 2, ovulationDay - 5);
  if (cycleDay <= settings.periodLength) return "menstrual";
  if (cycleDay < fertileStart) return "follicular";
  if (cycleDay <= ovulationDay + 1) return "ovulatory";
  return "luteal";
}

function phaseForDate(date: Date, starts: string[], settings: PeriodSettings): PhaseName | null {
  if (!starts.length) return null;
  const sorted = [...starts].sort();
  const lastStart = fromDayKey(sorted[sorted.length - 1]);
  const rawDay = daysBetween(lastStart, date) + 1;
  if (rawDay < 1) return null;
  const cl = calcCycleLength(starts, settings);
  return cyclePhaseForDay(((rawDay - 1) % cl) + 1, settings, cl);
}

function todayCycleDay(starts: string[], settings: PeriodSettings): number {
  const sorted = [...starts].sort();
  const lastStart = fromDayKey(sorted[sorted.length - 1]);
  const cl = calcCycleLength(starts, settings);
  const raw = daysBetween(lastStart, new Date()) + 1;
  return ((raw - 1) % cl) + 1;
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function energyForDay(day: number, cl: number, settings: PeriodSettings): number {
  const ovulationDay = cl - 14;
  const fertileStart = Math.max(settings.periodLength + 2, ovulationDay - 5);
  if (day <= settings.periodLength) {
    return 0.15 + (day / settings.periodLength) * 0.12;
  } else if (day < fertileStart) {
    const t = (day - settings.periodLength) / (fertileStart - settings.periodLength);
    return 0.27 + t * 0.58;
  } else if (day <= ovulationDay + 1) {
    const t = (day - fertileStart) / Math.max(1, ovulationDay + 1 - fertileStart);
    return 0.85 + Math.sin(t * Math.PI) * 0.15;
  } else {
    const t = (day - ovulationDay - 1) / Math.max(1, cl - ovulationDay - 1);
    return 0.85 - t * 0.65;
  }
}

function computeHealthScore(
  starts: string[],
  settings: PeriodSettings,
  dayLogs: Record<string, CycleDayLog>,
): number {
  if (!starts.length) return 0;
  const sorted = [...starts].sort();
  const lastStart = fromDayKey(sorted[sorted.length - 1]);
  const cl = calcCycleLength(starts, settings);

  // Regularity (0–40 pts)
  let reg = starts.length === 1 ? 20 : 30;
  if (starts.length >= 3) {
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++)
      diffs.push(daysBetween(fromDayKey(sorted[i - 1]), fromDayKey(sorted[i])));
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((s, d) => s + Math.abs(d - avg), 0) / diffs.length;
    reg = Math.max(0, Math.round(40 - variance * 4));
  }

  // Engagement (0–40 pts)
  const daysSince = Math.min(daysBetween(lastStart, new Date()) + 1, cl);
  let logged = 0;
  for (let i = 0; i < daysSince; i++) {
    const l = dayLogs[dayKey(addDays(lastStart, i))];
    if (l && (l.flow || l.mood || l.sex || (l.symptoms?.length ?? 0) > 0)) logged++;
  }
  const eng = daysSince > 0 ? Math.round((logged / daysSince) * 40) : 0;

  // Symptom lightness (0–20 pts)
  const withSymptoms = Object.values(dayLogs).filter((l) => l.symptoms?.length);
  const avgSym =
    withSymptoms.length > 0
      ? withSymptoms.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) /
        withSymptoms.length
      : 0;
  const sym = Math.max(0, Math.round(20 - avgSym * 3));

  return Math.min(100, reg + eng + sym);
}

function computeMoodByPhase(
  moodEntries: Record<string, MoodEntry>,
  starts: string[],
  settings: PeriodSettings,
): Record<PhaseName, { sum: number; count: number }> {
  const out: Record<PhaseName, { sum: number; count: number }> = {
    menstrual: { sum: 0, count: 0 },
    follicular: { sum: 0, count: 0 },
    ovulatory: { sum: 0, count: 0 },
    luteal: { sum: 0, count: 0 },
  };
  Object.entries(moodEntries).forEach(([dk, entry]) => {
    const phase = phaseForDate(fromDayKey(dk), starts, settings);
    if (!phase) return;
    out[phase].sum += entry.mood;
    out[phase].count++;
  });
  return out;
}

function computeSymptomPatterns(
  dayLogs: Record<string, CycleDayLog>,
  starts: string[],
  settings: PeriodSettings,
): Array<{ symptom: string; phase: PhaseName; total: number }> {
  const counts: Record<string, Partial<Record<PhaseName, number>>> = {};
  Object.entries(dayLogs).forEach(([dk, log]) => {
    if (!log.symptoms?.length) return;
    const phase = phaseForDate(fromDayKey(dk), starts, settings);
    if (!phase) return;
    log.symptoms.forEach((s) => {
      if (!counts[s]) counts[s] = {};
      counts[s][phase] = (counts[s][phase] ?? 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([symptom, phases]) => {
      const total = Object.values(phases).reduce((a, b) => a + b, 0);
      const topPhase = (Object.entries(phases) as [PhaseName, number][]).sort(
        (a, b) => b[1] - a[1],
      )[0][0];
      return { symptom, phase: topPhase, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
}

// ── Phase Horizon Bar ─────────────────────────────────────────────────────────

function PhaseHorizon({
  currentPhase,
  cycleDay,
}: {
  currentPhase: PhaseName | null;
  cycleDay: number | null;
}) {
  return (
    <div className="mb-4 flex gap-2">
      {PHASE_ORDER.map((p) => {
        const ph = PHASES[p];
        const active = p === currentPhase;
        return (
          <div
            key={p}
            className={`flex flex-1 flex-col items-center rounded-2xl py-3 transition-all duration-300 ${
              active ? "shadow-soft scale-[1.06]" : "opacity-40"
            }`}
            style={{ background: ph.bg }}
          >
            <span className={`text-xl leading-none ${active ? "" : "grayscale"}`}>{ph.emoji}</span>
            <span
              className="mt-1 text-[10px] font-bold leading-none"
              style={{ color: ph.accent }}
            >
              {ph.label}
            </span>
            {active && cycleDay !== null && (
              <span className="mt-1 text-[9px] font-semibold text-muted-foreground">
                Day {cycleDay}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Phase Energy Arc (SVG) ────────────────────────────────────────────────────

function CycleEnergyArc({
  cycleDay,
  cycleLength,
  settings,
  currentPhase,
}: {
  cycleDay: number;
  cycleLength: number;
  settings: PeriodSettings;
  currentPhase: PhaseName;
}) {
  const W = 320;
  const H = 72;
  const PX = 8;
  const PY = 10;
  const iW = W - PX * 2;
  const iH = H - PY * 2;

  const points = Array.from({ length: cycleLength }, (_, i) => ({
    x: PX + (i / (cycleLength - 1)) * iW,
    y: PY + (1 - energyForDay(i + 1, cycleLength, settings)) * iH,
  }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const t = 0.35;
    pathD += ` C ${p.x + (c.x - p.x) * t} ${p.y} ${c.x - (c.x - p.x) * t} ${c.y} ${c.x} ${c.y}`;
  }
  const fillD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const ovulationDay = cycleLength - 14;
  const fertileStart = Math.max(settings.periodLength + 2, ovulationDay - 5);
  const phaseSegs: Array<{ phase: PhaseName; s: number; e: number }> = [
    { phase: "menstrual",  s: 1,                        e: settings.periodLength },
    { phase: "follicular", s: settings.periodLength + 1, e: fertileStart - 1 },
    { phase: "ovulatory",  s: fertileStart,              e: ovulationDay + 1 },
    { phase: "luteal",     s: ovulationDay + 2,          e: cycleLength },
  ];

  const dot = points[Math.min(cycleDay - 1, points.length - 1)];

  return (
    <SoftCard className="!p-4 mb-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Energy Arc
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="arcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec6f9e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ec6f9e" stopOpacity="0" />
          </linearGradient>
          <clipPath id="arcClip">
            <rect x={PX} y={PY} width={iW} height={iH + 2} />
          </clipPath>
        </defs>

        {/* Phase background bands */}
        {phaseSegs.map(({ phase, s, e }) => {
          const x = PX + ((s - 1) / (cycleLength - 1)) * iW;
          const w = ((e - s) / (cycleLength - 1)) * iW;
          return (
            <rect
              key={phase}
              x={x}
              y={PY}
              width={Math.max(0, w)}
              height={iH}
              fill={PHASES[phase].bg}
              opacity={0.65}
            />
          );
        })}

        {/* Area fill */}
        <path d={fillD} fill="url(#arcFill)" clipPath="url(#arcClip)" />

        {/* Energy curve */}
        <path d={pathD} fill="none" stroke="#ec6f9e" strokeWidth="2" strokeLinecap="round" />

        {/* Current day indicator */}
        <circle cx={dot.x} cy={dot.y} r="10" fill={PHASES[currentPhase].accent} opacity={0.2} />
        <circle cx={dot.x} cy={dot.y} r="5.5" fill={PHASES[currentPhase].accent} />
        <circle cx={dot.x} cy={dot.y} r="2.5" fill="white" />
      </svg>

      {/* Phase labels */}
      <div className="mt-1 flex">
        {phaseSegs.map(({ phase, s, e }) => {
          const pct = ((e - s + 1) / cycleLength) * 100;
          return (
            <div key={phase} style={{ width: `${pct}%` }} className="text-center">
              <span className="text-[9px] font-bold" style={{ color: PHASES[phase].accent }}>
                {PHASES[phase].emoji}
              </span>
            </div>
          );
        })}
      </div>
    </SoftCard>
  );
}

// ── Phase Wellness Card ───────────────────────────────────────────────────────

function PhaseWellnessCard({ phase }: { phase: PhaseName }) {
  const ph = PHASES[phase];
  const w = PHASE_WELLNESS[phase];
  return (
    <SoftCard className="!p-0 overflow-hidden mb-4">
      <div className="px-5 py-4" style={{ background: ph.bg }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ph.emoji}</span>
          <div>
            <p className="font-display text-lg text-foreground">{ph.label} Phase</p>
            <p className="text-xs font-semibold" style={{ color: ph.accent }}>
              {w.energy}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {(
          [
            { label: "Workout 🏃‍♀️", value: w.workout, span: false },
            { label: "Nutrition 🥗", value: w.nutrition, span: false },
            { label: "Ritual ✨", value: w.ritual, span: true },
          ] as { label: string; value: string; span: boolean }[]
        ).map(({ label, value, span }) => (
          <div
            key={label}
            className={`rounded-2xl p-3 ${span ? "col-span-2" : ""}`}
            style={{ background: ph.bg }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold leading-snug text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <p className="px-5 pb-4 text-center text-sm italic text-muted-foreground">
        "{w.affirmation}"
      </p>
    </SoftCard>
  );
}

// ── Mood × Cycle Insight ──────────────────────────────────────────────────────

function MoodCycleInsight({
  moodByPhase,
}: {
  moodByPhase: Record<PhaseName, { sum: number; count: number }>;
}) {
  const hasAny = PHASE_ORDER.some((p) => moodByPhase[p].count > 0);
  if (!hasAny) return null;
  return (
    <SoftCard className="mb-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Mood × Cycle
      </p>
      <div className="flex gap-2">
        {PHASE_ORDER.map((p) => {
          const { sum, count } = moodByPhase[p];
          const ph = PHASES[p];
          if (count === 0)
            return (
              <div
                key={p}
                className="flex flex-1 flex-col items-center rounded-2xl py-3 opacity-30"
                style={{ background: ph.bg }}
              >
                <span className="text-lg grayscale">{ph.emoji}</span>
                <span className="mt-1 text-[10px] text-muted-foreground">—</span>
              </div>
            );
          const avg = sum / count;
          const moodEmoji = MOOD_EMOJIS[Math.round(avg) - 1] ?? "😐";
          return (
            <div
              key={p}
              className="flex flex-1 flex-col items-center rounded-2xl py-3"
              style={{ background: ph.bg }}
            >
              <span className="text-lg">{ph.emoji}</span>
              <span className="mt-1 text-xl">{moodEmoji}</span>
              <span className="mt-0.5 text-[10px] font-bold" style={{ color: ph.accent }}>
                {avg.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Average mood per cycle phase
      </p>
    </SoftCard>
  );
}

// ── Symptom Pattern Insight ───────────────────────────────────────────────────

function SymptomPatternInsight({
  patterns,
}: {
  patterns: Array<{ symptom: string; phase: PhaseName; total: number }>;
}) {
  if (!patterns.length) return null;
  return (
    <SoftCard className="mb-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Symptom Patterns
      </p>
      <div className="flex flex-col gap-2">
        {patterns.map(({ symptom, phase, total }) => (
          <div key={symptom} className="flex items-center gap-3">
            <span
              className="flex-1 rounded-full px-3 py-1.5 text-xs font-bold capitalize"
              style={{ background: PHASES[phase].bg, color: PHASES[phase].accent }}
            >
              {symptom}
            </span>
            <span className="text-xs text-muted-foreground">
              {PHASES[phase].emoji} {PHASES[phase].label}
            </span>
            <span className="rounded-full bg-blush px-2 py-0.5 text-xs font-bold text-secondary-foreground">
              ×{total}
            </span>
          </div>
        ))}
      </div>
    </SoftCard>
  );
}

// ── Cycle Health Score ────────────────────────────────────────────────────────

function CycleHealthScore({ score }: { score: number }) {
  const color =
    score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#ec6f9e";
  const label =
    score >= 70
      ? "Lovely rhythm 🌸"
      : score >= 40
      ? "Getting there 🌱"
      : "Log more for insights 💧";
  return (
    <SoftCard className="mb-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Cycle Health Score
      </p>
      <div className="flex items-center gap-4">
        <div
          className="relative size-16 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${color} ${score}%, #f8f4f4 ${score}%)`,
          }}
        >
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-card">
            <span className="text-sm font-black text-foreground">{score}</span>
          </div>
        </div>
        <div>
          <p className="font-bold text-foreground">{label}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            Regularity · logging streak · symptom load
          </p>
        </div>
      </div>
    </SoftCard>
  );
}

// ── Day Log Bottom Sheet ──────────────────────────────────────────────────────

function DayLogSheet({
  dk,
  phase,
  log,
  isPeriodStart,
  onChange,
  onTogglePeriodStart,
  onClose,
}: {
  dk: string;
  phase: PhaseName | null;
  log: CycleDayLog;
  isPeriodStart: boolean;
  onChange: (l: CycleDayLog) => void;
  onTogglePeriodStart: () => void;
  onClose: () => void;
}) {
  const ph = phase ? PHASES[phase] : null;
  const label = fromDayKey(dk).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function toggleSymptom(s: string) {
    const cur = log.symptoms ?? [];
    onChange({ ...log, symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-background shadow-2xl"
        style={{ borderTop: `4px solid ${ph?.accent ?? "var(--primary)"}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[88dvh] overflow-y-auto p-6 pb-8">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="font-display text-xl text-foreground">{label}</p>
              {ph && (
                <p className="mt-0.5 text-xs font-bold" style={{ color: ph.accent }}>
                  {ph.emoji} {ph.label} · {ph.desc}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-blush transition"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Period start */}
          <button
            onClick={onTogglePeriodStart}
            className={`mb-5 w-full rounded-2xl py-3 text-sm font-bold transition ${
              isPeriodStart
                ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                : "bg-blush text-primary hover:scale-[1.01]"
            }`}
          >
            {isPeriodStart
              ? "🩸 Period started here — tap to remove"
              : "🩸 Mark as period start"}
          </button>

          {/* Flow */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Flow
          </p>
          <div className="mb-5 grid grid-cols-4 gap-2">
            {FLOW.map((f) => (
              <button
                key={f}
                onClick={() => onChange({ ...log, flow: log.flow === f ? undefined : f })}
                className={`rounded-xl py-2 text-xs font-bold capitalize transition ${
                  log.flow === f
                    ? "bg-rose-400 text-white shadow-sm"
                    : "bg-blush text-secondary-foreground hover:bg-rose-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Mood */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Mood
          </p>
          <div className="mb-5 flex justify-between px-2">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => onChange({ ...log, mood: log.mood === i + 1 ? undefined : i + 1 })}
                className={`text-2xl transition-transform ${
                  log.mood === i + 1
                    ? "scale-[1.45]"
                    : "opacity-40 hover:opacity-80 hover:scale-110"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Intimacy */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Intimacy
          </p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(["protected", "unprotected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChange({ ...log, sex: log.sex === s ? undefined : s })}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  log.sex === s
                    ? s === "protected"
                      ? "bg-emerald-400 text-white"
                      : "bg-violet-400 text-white"
                    : "bg-blush text-secondary-foreground hover:bg-pink-100"
                }`}
              >
                {s === "protected" ? "🛡️ Protected" : "💞 Unprotected"}
              </button>
            ))}
          </div>

          {/* Ovulation */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Ovulation
          </p>
          <button
            onClick={() => onChange({ ...log, ovulation: !log.ovulation })}
            className={`mb-5 w-full rounded-xl py-2.5 text-xs font-bold transition ${
              log.ovulation
                ? "bg-fuchsia-400 text-white"
                : "bg-blush text-secondary-foreground hover:bg-fuchsia-100"
            }`}
          >
            {log.ovulation ? "🌸 Ovulation signs logged" : "🌸 Log ovulation signs"}
          </button>

          {/* Symptoms */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Symptoms
          </p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = log.symptoms?.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "bg-blush text-secondary-foreground hover:bg-pink-100"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Onboarding Modal ──────────────────────────────────────────────────────────

function OnboardingModal({
  onSave,
  onClose,
}: {
  onSave: (firstDay: string, settings: PeriodSettings) => void;
  onClose: () => void;
}) {
  const now = new Date();
  const todayStr = dayKey();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1);
  };
  const nextMonth = () => {
    if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        <h2 className="mb-1 font-script text-3xl text-gradient-pink">Start your cycle 🌸</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Pick the first day of your last period
        </p>

        {/* Mini picker calendar */}
        <div className="mb-5 rounded-2xl bg-blush p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-full p-1.5 hover:bg-white/60 transition">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-bold text-foreground">{monthLabel}</span>
            <button onClick={nextMonth} className="rounded-full p-1.5 hover:bg-white/60 transition">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-muted-foreground">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((date, i) => {
              if (!date) return <div key={i} />;
              const dk = dayKey(date);
              const isFuture = dk > todayStr;
              const selected = dk === selectedKey;
              return (
                <button
                  key={i}
                  disabled={isFuture}
                  onClick={() => setSelectedKey(dk)}
                  className={`aspect-square rounded-xl text-xs font-bold transition ${
                    selected
                      ? "bg-gradient-pink text-primary-foreground shadow-pink"
                      : isFuture
                      ? "cursor-default text-muted-foreground/25"
                      : "text-foreground hover:bg-white/70"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="mb-6 space-y-4">
          <label className="block text-xs font-bold text-secondary-foreground">
            Average cycle length:{" "}
            <span className="text-primary">{cycleLength} days</span>
            <input
              type="range" min={21} max={40} value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-bold text-secondary-foreground">
            Bleeding duration:{" "}
            <span className="text-primary">{periodLength} days</span>
            <input
              type="range" min={2} max={10} value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>
        </div>

        <button
          disabled={!selectedKey}
          onClick={() => selectedKey && onSave(selectedKey, { cycleLength, periodLength })}
          className="w-full rounded-full bg-gradient-pink py-3 font-bold text-primary-foreground shadow-pink transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Tracking 🌸
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Settings Sheet ────────────────────────────────────────────────────────────

function SettingsSheet({
  settings,
  onChange,
  onClose,
}: {
  settings: PeriodSettings;
  onChange: (s: PeriodSettings) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-background p-6 pb-10 shadow-2xl"
        style={{ borderTop: "4px solid #ec6f9e" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-xl text-foreground">Cycle settings</p>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-blush transition"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-5">
          <label className="block text-xs font-bold text-secondary-foreground">
            Average cycle length:{" "}
            <span className="text-primary">{settings.cycleLength} days</span>
            <input
              type="range" min={21} max={40} value={settings.cycleLength}
              onChange={(e) => onChange({ ...settings, cycleLength: Number(e.target.value) })}
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-bold text-secondary-foreground">
            Bleeding duration:{" "}
            <span className="text-primary">{settings.periodLength} days</span>
            <input
              type="range" min={2} max={10} value={settings.periodLength}
              onChange={(e) => onChange({ ...settings, periodLength: Number(e.target.value) })}
              className="mt-1 w-full accent-primary"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PeriodTracker() {
  const tool = toolBySlug("period")!;
  const [starts, setStarts] = useBloomState<string[]>(KEYS.periodStarts, []);
  const [settings, setSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, {
    cycleLength: 28,
    periodLength: 5,
  });
  const [dayLogs, setDayLogs] = useBloomState<Record<string, CycleDayLog>>(
    KEYS.cycleDayLogs,
    {},
  );
  const [moodEntries] = useBloomState<Record<string, MoodEntry>>(KEYS.moodEntries, {});

  const today = new Date();
  const todayStr = dayKey();

  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());
  const [selectedDk, setSelectedDk] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasData = starts.length > 0;
  const currentPhase = hasData ? phaseForDate(today, starts, settings) : null;
  const cycDay = hasData ? todayCycleDay(starts, settings) : null;
  const cl = hasData ? calcCycleLength(starts, settings) : 28;

  // Derived insight data
  const healthScore = useMemo(
    () => computeHealthScore(starts, settings, dayLogs),
    [starts, settings, dayLogs],
  );
  const moodByPhase = useMemo(
    () => computeMoodByPhase(moodEntries, starts, settings),
    [moodEntries, starts, settings],
  );
  const symptomPatterns = useMemo(
    () => computeSymptomPatterns(dayLogs, starts, settings),
    [dayLogs, starts, settings],
  );

  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1);
  };
  const nextMonth = () => {
    if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1);
  };

  const handleOnboardingSave = (firstDay: string, s: PeriodSettings) => {
    setStarts([firstDay]);
    setSettings(s);
    setShowOnboarding(false);
  };

  const selectedPhase = selectedDk
    ? phaseForDate(fromDayKey(selectedDk), starts, settings)
    : null;

  return (
    <div>
      <ToolHeader tool={tool} />

      {/* 1 — Phase Horizon */}
      <PhaseHorizon currentPhase={currentPhase} cycleDay={cycDay} />

      {/* 2 — Energy Arc (only when tracking) */}
      {hasData && currentPhase && cycDay !== null && (
        <CycleEnergyArc
          cycleDay={cycDay}
          cycleLength={cl}
          settings={settings}
          currentPhase={currentPhase}
        />
      )}

      {/* 3 — Calendar */}
      <SoftCard className="relative !p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-full p-1.5 hover:bg-blush transition">
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-foreground">{monthLabel}</span>
            {hasData && (
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full p-1 text-muted-foreground hover:bg-blush transition"
              >
                <Settings2 className="size-3.5" />
              </button>
            )}
          </div>
          <button onClick={nextMonth} className="rounded-full p-1.5 hover:bg-blush transition">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center">
          {DAY_HEADERS.map((d) => (
            <span key={d} className="text-[10px] font-bold text-muted-foreground">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} />;
            const dk = dayKey(date);
            const isToday = dk === todayStr;
            const isPeriodStart = starts.includes(dk);
            const phase = hasData ? phaseForDate(date, starts, settings) : null;
            const isFuture = date > today;
            const log = dayLogs[dk];
            const hasLog = !!(log?.flow || log?.mood || log?.sex || log?.ovulation || (log?.symptoms?.length ?? 0) > 0);

            return (
              <button
                key={i}
                onClick={() => (hasData ? setSelectedDk(dk) : setShowOnboarding(true))}
                className={`relative flex flex-col items-center rounded-xl py-2 transition ${
                  isToday ? "ring-2 ring-primary ring-offset-1" : ""
                } ${hasData ? "hover:scale-105 hover:shadow-sm" : "cursor-pointer"}`}
                style={{
                  background: phase
                    ? `${PHASES[phase].bg}${isFuture ? "80" : "dd"}`
                    : "#f8f4f4",
                }}
              >
                {isPeriodStart && (
                  <span className="absolute right-0.5 top-0.5 text-[7px] leading-none">🩸</span>
                )}
                {log?.ovulation && (
                  <span className="absolute left-0.5 top-0.5 text-[7px] leading-none">🌸</span>
                )}
                <span
                  className={`text-xs font-bold leading-none ${
                    isToday ? "text-primary" : isFuture ? "text-muted-foreground/60" : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </span>
                {hasLog && <span className="mt-1 size-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* Start Log overlay */}
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-background/70 backdrop-blur-[2px]">
            <button
              onClick={() => setShowOnboarding(true)}
              className="animate-pulse rounded-full bg-gradient-pink px-8 py-4 text-base font-bold text-primary-foreground shadow-pink transition hover:animate-none hover:scale-105"
            >
              🌸 Start Log
            </button>
            <p className="mt-3 text-xs text-muted-foreground">Track your cycle beautifully</p>
          </div>
        )}
      </SoftCard>

      {/* 4 — Phase legend */}
      {hasData && (
        <div className="mb-4 flex flex-wrap gap-2">
          {PHASE_ORDER.map((p) => (
            <span
              key={p}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
              style={{ background: PHASES[p].bg, color: PHASES[p].accent }}
            >
              {PHASES[p].emoji} {PHASES[p].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-[10px] font-bold text-muted-foreground">
            🩸 Period · 🌸 Ovulation · • Log
          </span>
        </div>
      )}

      {/* 5 — Phase Wellness Card */}
      {hasData && currentPhase && <PhaseWellnessCard phase={currentPhase} />}

      {/* 6 — Insights (shown when there's data to analyse) */}
      {hasData && (
        <>
          <CycleHealthScore score={healthScore} />
          <MoodCycleInsight moodByPhase={moodByPhase} />
          <SymptomPatternInsight patterns={symptomPatterns} />
        </>
      )}

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal onSave={handleOnboardingSave} onClose={() => setShowOnboarding(false)} />
      )}
      {showSettings && (
        <SettingsSheet settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      )}
      {selectedDk && (
        <DayLogSheet
          dk={selectedDk}
          phase={selectedPhase}
          log={dayLogs[selectedDk] ?? {}}
          isPeriodStart={starts.includes(selectedDk)}
          onChange={(log) => setDayLogs((prev) => ({ ...prev, [selectedDk]: log }))}
          onTogglePeriodStart={() => {
            const dk = selectedDk;
            setStarts((prev) =>
              prev.includes(dk) ? prev.filter((d) => d !== dk) : [...prev, dk].sort(),
            );
          }}
          onClose={() => setSelectedDk(null)}
        />
      )}
    </div>
  );
}
