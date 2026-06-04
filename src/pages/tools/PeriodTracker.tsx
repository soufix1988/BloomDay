import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Settings2, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useBloomState } from "@/hooks/useBloomState";
import {
  KEYS,
  type PeriodSettings,
  type CycleDayLog,
  type MoodEntry,
} from "@/data/schemas";
import { dayKey, fromDayKey, daysBetween, addDays } from "@/lib/date";

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

function computeHealthScore(
  starts: string[],
  settings: PeriodSettings,
  dayLogs: Record<string, CycleDayLog>,
): number {
  if (!starts.length) return 0;
  const sorted = [...starts].sort();
  const lastStart = fromDayKey(sorted[sorted.length - 1]);
  const cl = calcCycleLength(starts, settings);
  let reg = starts.length === 1 ? 20 : 30;
  if (starts.length >= 3) {
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++)
      diffs.push(daysBetween(fromDayKey(sorted[i - 1]), fromDayKey(sorted[i])));
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((s, d) => s + Math.abs(d - avg), 0) / diffs.length;
    reg = Math.max(0, Math.round(40 - variance * 4));
  }
  const daysSince = Math.min(daysBetween(lastStart, new Date()) + 1, cl);
  let logged = 0;
  for (let i = 0; i < daysSince; i++) {
    const l = dayLogs[dayKey(addDays(lastStart, i))];
    if (l && (l.flow || l.mood || l.sex || (l.symptoms?.length ?? 0) > 0)) logged++;
  }
  const eng = daysSince > 0 ? Math.round((logged / daysSince) * 40) : 0;
  const withSym = Object.values(dayLogs).filter((l) => l.symptoms?.length);
  const avgSym = withSym.length > 0
    ? withSym.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) / withSym.length : 0;
  return Math.min(100, reg + eng + Math.max(0, Math.round(20 - avgSym * 3)));
}

function computeMoodByPhase(
  moodEntries: Record<string, MoodEntry>,
  starts: string[],
  settings: PeriodSettings,
): Record<PhaseName, { sum: number; count: number }> {
  const out: Record<PhaseName, { sum: number; count: number }> = {
    menstrual: { sum: 0, count: 0 }, follicular: { sum: 0, count: 0 },
    ovulatory: { sum: 0, count: 0 }, luteal: { sum: 0, count: 0 },
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
  return Object.entries(counts).map(([symptom, phases]) => {
    const total = Object.values(phases).reduce((a, b) => a + b, 0);
    const topPhase = (Object.entries(phases) as [PhaseName, number][]).sort((a, b) => b[1] - a[1])[0][0];
    return { symptom, phase: topPhase, total };
  }).sort((a, b) => b.total - a.total).slice(0, 4);
}

// ── Day Log Bottom Sheet ──────────────────────────────────────────────────────

function DayLogSheet({
  dk, phase, log, isPeriodStart, onChange, onTogglePeriodStart, onClose,
}: {
  dk: string; phase: PhaseName | null; log: CycleDayLog; isPeriodStart: boolean;
  onChange: (l: CycleDayLog) => void; onTogglePeriodStart: () => void; onClose: () => void;
}) {
  const ph = phase ? PHASES[phase] : null;
  const label = fromDayKey(dk).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  function toggleSymptom(s: string) {
    const cur = log.symptoms ?? [];
    onChange({ ...log, symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[2rem] bg-background shadow-2xl overflow-hidden"
        style={{ borderTop: `4px solid ${ph?.accent ?? "var(--primary)"}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet header */}
        <div className="px-6 pt-5 pb-4" style={{ background: ph?.bg ?? "#fdf2f8" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-2xl text-foreground">{label}</p>
              {ph && <p className="text-sm font-bold" style={{ color: ph.accent }}>{ph.emoji} {ph.label} · {ph.desc}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 bg-white/60 text-muted-foreground hover:bg-white transition">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70dvh] overflow-y-auto px-6 pb-8 pt-4">
          {/* Period start */}
          <button
            onClick={onTogglePeriodStart}
            className={`mb-5 w-full rounded-2xl py-3 text-sm font-bold transition ${
              isPeriodStart ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
              : "bg-gradient-pink text-primary-foreground shadow-pink hover:scale-[1.02]"
            }`}
          >
            {isPeriodStart ? "🩸 Period started here — tap to remove" : "🩸 Mark as period start"}
          </button>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Flow</p>
          <div className="mb-5 grid grid-cols-4 gap-2">
            {FLOW.map((f) => (
              <button key={f}
                onClick={() => onChange({ ...log, flow: log.flow === f ? undefined : f })}
                className={`rounded-xl py-2.5 text-xs font-bold capitalize transition ${
                  log.flow === f ? "bg-rose-400 text-white shadow-sm scale-105"
                  : "bg-blush text-secondary-foreground hover:bg-rose-100"
                }`}
              >{f}</button>
            ))}
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mood</p>
          <div className="mb-5 flex justify-between px-2">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button key={i}
                onClick={() => onChange({ ...log, mood: log.mood === i + 1 ? undefined : i + 1 })}
                className={`text-3xl transition-transform ${log.mood === i + 1 ? "scale-[1.4]" : "opacity-40 hover:opacity-80 hover:scale-110"}`}
              >{emoji}</button>
            ))}
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Intimacy</p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(["protected", "unprotected"] as const).map((s) => (
              <button key={s}
                onClick={() => onChange({ ...log, sex: log.sex === s ? undefined : s })}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  log.sex === s
                    ? s === "protected" ? "bg-emerald-400 text-white scale-105" : "bg-violet-400 text-white scale-105"
                    : "bg-blush text-secondary-foreground hover:bg-pink-100"
                }`}
              >{s === "protected" ? "🛡️ Protected" : "💞 Unprotected"}</button>
            ))}
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ovulation</p>
          <button
            onClick={() => onChange({ ...log, ovulation: !log.ovulation })}
            className={`mb-5 w-full rounded-xl py-2.5 text-xs font-bold transition ${
              log.ovulation ? "bg-fuchsia-400 text-white scale-[1.02]"
              : "bg-blush text-secondary-foreground hover:bg-fuchsia-100"
            }`}
          >{log.ovulation ? "🌸 Ovulation signs logged ✓" : "🌸 Log ovulation signs"}</button>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = log.symptoms?.includes(s);
              return (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
                    on ? "bg-gradient-pink text-primary-foreground shadow-pink"
                    : "bg-blush text-secondary-foreground hover:bg-pink-100"
                  }`}
                >{s}</button>
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
  onSave, onClose,
}: {
  onSave: (firstDay: string, settings: PeriodSettings) => void; onClose: () => void;
}) {
  const now = new Date();
  const todayStr = dayKey();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevMonth = () => { if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1); };
  const nextMonth = () => { if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-pink px-6 py-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-8 -right-8 size-24 rounded-full bg-sunburst opacity-20 animate-spin-slow" />
          <Sparkles className="absolute top-3 right-10 size-4 animate-sparkle opacity-70" />
          <Heart className="absolute bottom-3 left-16 size-3 fill-current animate-float opacity-60" style={{ animationDelay: "1s" }} />
          <p className="font-script text-xl opacity-90 relative z-10">let's get started</p>
          <h2 className="font-display text-3xl relative z-10">Your Cycle 🌸</h2>
          <p className="text-sm opacity-80 mt-1 relative z-10">Pick the first day of your last period</p>
        </div>

        <div className="p-5">
          {/* Picker calendar */}
          <div className="mb-5 rounded-2xl bg-blush p-4">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-full p-1.5 hover:bg-white/60 transition"><ChevronLeft className="size-4" /></button>
              <span className="text-sm font-bold text-foreground">{monthLabel}</span>
              <button onClick={nextMonth} className="rounded-full p-1.5 hover:bg-white/60 transition"><ChevronRight className="size-4" /></button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center">
              {["M","T","W","T","F","S","S"].map((d, i) => (
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
                  <button key={i} disabled={isFuture} onClick={() => setSelectedKey(dk)}
                    className={`aspect-square rounded-xl text-xs font-bold transition ${
                      selected ? "bg-gradient-pink text-primary-foreground shadow-pink"
                      : isFuture ? "cursor-default text-muted-foreground/25"
                      : "text-foreground hover:bg-white/70"
                    }`}
                  >{date.getDate()}</button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="mb-6 space-y-4">
            <label className="block text-xs font-bold text-secondary-foreground">
              Average cycle length: <span className="text-primary">{cycleLength} days</span>
              <input type="range" min={21} max={40} value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))} className="mt-1 w-full accent-primary" />
            </label>
            <label className="block text-xs font-bold text-secondary-foreground">
              Bleeding duration: <span className="text-primary">{periodLength} days</span>
              <input type="range" min={2} max={10} value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))} className="mt-1 w-full accent-primary" />
            </label>
          </div>

          <button
            disabled={!selectedKey}
            onClick={() => selectedKey && onSave(selectedKey, { cycleLength, periodLength })}
            className="w-full rounded-full bg-gradient-pink py-3.5 font-bold text-primary-foreground shadow-pink transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >Start Tracking 🌸</button>
          <button onClick={onClose} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings Sheet ────────────────────────────────────────────────────────────

function SettingsSheet({ settings, onChange, onClose }: {
  settings: PeriodSettings; onChange: (s: PeriodSettings) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-[2rem] bg-background shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-pink px-6 py-4 text-primary-foreground flex items-center justify-between">
          <p className="font-display text-xl">Cycle settings</p>
          <button onClick={onClose} className="rounded-full p-1 bg-white/20 hover:bg-white/40 transition"><X className="size-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <label className="block text-xs font-bold text-secondary-foreground">
            Average cycle length: <span className="text-primary">{settings.cycleLength} days</span>
            <input type="range" min={21} max={40} value={settings.cycleLength}
              onChange={(e) => onChange({ ...settings, cycleLength: Number(e.target.value) })} className="mt-1 w-full accent-primary" />
          </label>
          <label className="block text-xs font-bold text-secondary-foreground">
            Bleeding duration: <span className="text-primary">{settings.periodLength} days</span>
            <input type="range" min={2} max={10} value={settings.periodLength}
              onChange={(e) => onChange({ ...settings, periodLength: Number(e.target.value) })} className="mt-1 w-full accent-primary" />
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PeriodTracker() {
  const [starts, setStarts] = useBloomState<string[]>(KEYS.periodStarts, []);
  const [settings, setSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, { cycleLength: 28, periodLength: 5 });
  const [dayLogs, setDayLogs] = useBloomState<Record<string, CycleDayLog>>(KEYS.cycleDayLogs, {});
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

  const healthScore = useMemo(() => computeHealthScore(starts, settings, dayLogs), [starts, settings, dayLogs]);
  const moodByPhase = useMemo(() => computeMoodByPhase(moodEntries, starts, settings), [moodEntries, starts, settings]);
  const symptomPatterns = useMemo(() => computeSymptomPatterns(dayLogs, starts, settings), [dayLogs, starts, settings]);

  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevMonth = () => { if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1); };
  const nextMonth = () => { if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1); };

  const handleOnboardingSave = (firstDay: string, s: PeriodSettings) => {
    setStarts([firstDay]);
    setSettings(s);
    setShowOnboarding(false);
  };
  const selectedPhase = selectedDk ? phaseForDate(fromDayKey(selectedDk), starts, settings) : null;

  const ph = currentPhase ? PHASES[currentPhase] : null;
  const w = currentPhase ? PHASE_WELLNESS[currentPhase] : null;

  return (
    <div className="relative -mx-4 sm:-mx-8 -mt-6 sm:-mt-10 overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-dots/70 px-4 sm:px-8 pt-6 pb-10">
        {/* Ambient decorative sparkles */}
        <Sparkles className="absolute top-6 left-6 size-4 text-primary/50 animate-sparkle" />
        <Sparkles className="absolute top-10 right-10 size-5 text-primary animate-sparkle" style={{ animationDelay: ".8s" }} />
        <Heart className="absolute top-24 left-3 size-4 text-hot fill-hot animate-float" style={{ animationDelay: ".5s" }} />
        <Heart className="absolute top-14 right-4 size-3 text-primary fill-primary animate-float" style={{ animationDelay: "1.3s" }} />

        {/* Back link */}
        <Link to="/app/tools" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition">
          <ChevronLeft className="size-4" /> All tools
        </Link>

        {/* Hero card */}
        <div className="relative bg-gradient-hero rounded-[2.5rem] border-pop shadow-pink p-6 sm:p-10 overflow-hidden">
          {/* Spinning sunburst */}
          <div className="absolute -top-20 -right-20 size-56 rounded-full bg-sunburst opacity-25 animate-spin-slow pointer-events-none" />
          {/* Floating blob accent */}
          <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-bubble animate-blob opacity-50 pointer-events-none" />

          <Sparkles className="absolute top-5 left-10 size-5 text-primary/60 animate-sparkle" />
          <Heart className="absolute bottom-6 right-10 size-6 text-hot fill-hot animate-float" />
          <Heart className="absolute top-6 right-6 size-4 text-primary fill-primary animate-float" style={{ animationDelay: "2s" }} />

          <div className="relative z-10">
            <p className="font-script text-2xl text-hot">know your rhythm</p>
            <h1 className="font-display text-6xl sm:text-7xl text-gradient-pink leading-tight drop-shadow-sm">
              Cycle 🌸
            </h1>

            {hasData && ph && cycDay !== null ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2 text-base font-bold text-foreground shadow-soft border-pop">
                  {ph.emoji} {ph.label} · Day {cycDay}
                </span>
                <span className="text-sm font-semibold text-secondary-foreground">{ph.desc}</span>
              </div>
            ) : (
              <p className="mt-3 text-base text-secondary-foreground/80 max-w-sm">
                Track your cycle, understand your moods & body patterns.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── PHASE HORIZON ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 -mt-5 relative z-10 mb-4">
        <div className="rounded-3xl bg-card border-pop shadow-soft p-4">
          <div className="grid grid-cols-4 gap-2">
            {PHASE_ORDER.map((p) => {
              const pp = PHASES[p];
              const active = p === currentPhase;
              return (
                <div
                  key={p}
                  className={`flex flex-col items-center rounded-2xl py-4 transition-all duration-300 ${
                    active ? "shadow-pink scale-[1.07]" : "opacity-60 hover:opacity-80"
                  }`}
                  style={{ background: active ? `linear-gradient(135deg, ${pp.accent}cc, ${pp.accent}88)` : pp.bg }}
                >
                  <span className={`text-2xl leading-none transition ${active ? "" : "grayscale"}`}>{pp.emoji}</span>
                  <span className="mt-1.5 text-[10px] font-bold leading-none" style={{ color: active ? "white" : pp.accent }}>
                    {pp.label}
                  </span>
                  {active && cycDay !== null && (
                    <span className="mt-1 text-[9px] font-bold text-white/80">Day {cycDay}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CALENDAR ────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-8 bg-checker/70 mb-4">
        <Sparkles className="absolute top-4 right-8 size-4 text-primary/40 animate-sparkle" style={{ animationDelay: ".4s" }} />
        <Heart className="absolute bottom-4 left-6 size-3 text-hot/50 fill-hot animate-float" style={{ animationDelay: "1.8s" }} />

        <div className="relative bg-card rounded-3xl border-pop shadow-pink p-5 overflow-hidden">
          {/* Corner decoration */}
          <div className="absolute -bottom-6 -right-6 size-20 rounded-full bg-sunburst opacity-10 animate-spin-slow pointer-events-none" />

          {/* Month nav */}
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-full p-2 hover:bg-blush transition"><ChevronLeft className="size-4" /></button>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-foreground">{monthLabel}</span>
              {hasData && (
                <button onClick={() => setShowSettings(true)} className="rounded-full p-1 text-muted-foreground hover:bg-blush transition">
                  <Settings2 className="size-3.5" />
                </button>
              )}
            </div>
            <button onClick={nextMonth} className="rounded-full p-2 hover:bg-blush transition"><ChevronRight className="size-4" /></button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {DAY_HEADERS.map((d) => (
              <span key={d} className="text-[10px] font-bold text-muted-foreground">{d}</span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
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
                  onClick={() => hasData ? setSelectedDk(dk) : setShowOnboarding(true)}
                  className={`relative flex flex-col items-center rounded-2xl py-2.5 transition-all ${
                    isToday ? "ring-2 ring-primary ring-offset-1 scale-105" : ""
                  } ${hasData ? "hover:scale-110 hover:shadow-md hover:-translate-y-0.5" : "cursor-pointer"}`}
                  style={{ background: phase ? `${PHASES[phase].bg}${isFuture ? "70" : "ee"}` : "#f8f4f4" }}
                >
                  {isPeriodStart && <span className="absolute right-0.5 top-0.5 text-[7px]">🩸</span>}
                  {log?.ovulation && <span className="absolute left-0.5 top-0.5 text-[7px]">🌸</span>}
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : isFuture ? "text-muted-foreground/50" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                  {hasLog && <span className="mt-0.5 size-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>

          {/* Phase legend */}
          {hasData && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PHASE_ORDER.map((p) => (
                <span key={p} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold"
                  style={{ background: PHASES[p].bg, color: PHASES[p].accent }}>
                  {PHASES[p].emoji} {PHASES[p].label}
                </span>
              ))}
              <span className="flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-[9px] font-bold text-muted-foreground">
                🩸 Period · 🌸 Ovulation · • Log
              </span>
            </div>
          )}

          {/* Start Log overlay */}
          {!hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-background/75 backdrop-blur-[3px]">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-pink blur-xl opacity-50 animate-pulse" />
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="relative rounded-full bg-gradient-pink px-10 py-5 text-lg font-black text-primary-foreground shadow-pink transition hover:scale-110 hover:shadow-2xl"
                >
                  🌸 Start Log
                </button>
              </div>
              <p className="mt-4 font-script text-xl text-hot">your journey starts here</p>
            </div>
          )}
        </div>
      </section>

      {/* ── PHASE WELLNESS ─────────────────────────────────────────────────── */}
      {hasData && currentPhase && w && ph && (
        <section className="relative px-4 sm:px-8 py-8 mb-4 overflow-hidden">
          {/* Background sunburst */}
          <div className="absolute inset-0 bg-sunburst opacity-10 animate-spin-slow pointer-events-none" />

          <Sparkles className="absolute top-6 right-8 size-5 text-primary animate-sparkle" style={{ animationDelay: ".3s" }} />
          <Heart className="absolute top-8 left-4 size-4 text-hot fill-hot animate-float" />
          <Heart className="absolute bottom-6 right-6 size-5 text-primary fill-primary animate-float" style={{ animationDelay: "1.5s" }} />

          <div className="relative bg-gradient-hero rounded-[2rem] border-pop shadow-pink overflow-hidden">
            {/* Phase color header */}
            <div className="px-6 py-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${ph.bg}, white)` }}>
              <div className="absolute -right-8 -top-8 size-28 rounded-full opacity-30 animate-blob" style={{ background: ph.accent }} />
              <div className="relative z-10 flex items-center gap-4">
                <span className="text-5xl">{ph.emoji}</span>
                <div>
                  <p className="font-script text-xl" style={{ color: ph.accent }}>you are in</p>
                  <p className="font-display text-3xl text-foreground">{ph.label} Phase</p>
                  <p className="text-sm font-semibold" style={{ color: ph.accent }}>{w.energy}</p>
                </div>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-2 gap-3 p-5">
              {([
                { label: "Workout 🏃‍♀️", value: w.workout },
                { label: "Nutrition 🥗", value: w.nutrition },
                { label: "Ritual ✨", value: w.ritual, full: true },
              ] as { label: string; value: string; full?: boolean }[]).map(({ label, value, full }) => (
                <div key={label} className={`rounded-2xl p-4 ${full ? "col-span-2" : ""}`}
                  style={{ background: ph.bg }}>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold leading-snug text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Affirmation */}
            <div className="px-6 pb-7 text-center">
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Sparkles key={i} className="size-3 text-primary animate-sparkle" style={{ animationDelay: `${i * 0.4}s` }} />
                ))}
              </div>
              <p className="font-script text-2xl sm:text-3xl text-hot">"{w.affirmation}"</p>
            </div>
          </div>
        </section>
      )}

      {/* ── INSIGHTS ────────────────────────────────────────────────────────── */}
      {hasData && (
        <section className="relative px-4 sm:px-8 py-10 bg-dots-lg/70">
          <Sparkles className="absolute top-6 left-8 size-4 text-primary/50 animate-sparkle" />
          <Heart className="absolute top-8 right-6 size-4 text-hot fill-hot animate-float" style={{ animationDelay: "0.7s" }} />

          {/* Section header */}
          <div className="mb-6 text-center relative z-10">
            <p className="font-script text-2xl text-hot">patterns & progress</p>
            <h2 className="font-display text-3xl sm:text-4xl text-gradient-pink">Your Cycle Story</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
            {/* Health Score */}
            <div className="bg-card rounded-3xl border-pop shadow-soft p-5 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 size-20 rounded-full bg-sunburst opacity-10 animate-spin-slow" />
              <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cycle Health Score</p>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0 size-20 rounded-full"
                  style={{ background: `conic-gradient(var(--color-primary) ${healthScore}%, #f8f4f4 ${healthScore}%)` }}>
                  <div className="absolute inset-2.5 flex items-center justify-center rounded-full bg-card">
                    <span className="text-lg font-black text-foreground">{healthScore}</span>
                  </div>
                </div>
                <div>
                  <p className="font-display text-xl text-foreground">
                    {healthScore >= 70 ? "Lovely rhythm 🌸" : healthScore >= 40 ? "Getting there 🌱" : "Keep logging 💧"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">regularity · logging · symptoms</p>
                </div>
              </div>
            </div>

            {/* Mood × Cycle */}
            {(() => {
              const hasAny = PHASE_ORDER.some((p) => moodByPhase[p].count > 0);
              if (!hasAny) return null;
              return (
                <div className="bg-card rounded-3xl border-pop shadow-soft p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mood × Cycle</p>
                  <div className="flex gap-2">
                    {PHASE_ORDER.map((p) => {
                      const { sum, count } = moodByPhase[p];
                      const pp = PHASES[p];
                      if (count === 0) return (
                        <div key={p} className="flex flex-1 flex-col items-center rounded-2xl py-3 opacity-25" style={{ background: pp.bg }}>
                          <span className="text-xl grayscale">{pp.emoji}</span>
                          <span className="mt-1 text-[9px] text-muted-foreground">—</span>
                        </div>
                      );
                      const avg = sum / count;
                      return (
                        <div key={p} className="flex flex-1 flex-col items-center rounded-2xl py-3" style={{ background: pp.bg }}>
                          <span className="text-xl">{pp.emoji}</span>
                          <span className="mt-1 text-xl">{MOOD_EMOJIS[Math.round(avg) - 1] ?? "😐"}</span>
                          <span className="text-[9px] font-bold" style={{ color: pp.accent }}>{avg.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">avg mood per phase</p>
                </div>
              );
            })()}

            {/* Symptom Patterns */}
            {symptomPatterns.length > 0 && (
              <div className="bg-card rounded-3xl border-pop shadow-soft p-5 sm:col-span-2">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Symptom Patterns</p>
                <div className="flex flex-col gap-2">
                  {symptomPatterns.map(({ symptom, phase, total }) => (
                    <div key={symptom} className="flex items-center gap-3">
                      <span className="flex-1 rounded-full px-3 py-2 text-xs font-bold capitalize"
                        style={{ background: PHASES[phase].bg, color: PHASES[phase].accent }}>
                        {symptom}
                      </span>
                      <span className="text-xs text-muted-foreground">{PHASES[phase].emoji} {PHASES[phase].label}</span>
                      <span className="rounded-full bg-gradient-pink px-2.5 py-1 text-[10px] font-bold text-primary-foreground">×{total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      {showOnboarding && <OnboardingModal onSave={handleOnboardingSave} onClose={() => setShowOnboarding(false)} />}
      {showSettings && <SettingsSheet settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
      {selectedDk && (
        <DayLogSheet
          dk={selectedDk}
          phase={selectedPhase}
          log={dayLogs[selectedDk] ?? {}}
          isPeriodStart={starts.includes(selectedDk)}
          onChange={(log) => setDayLogs((prev) => ({ ...prev, [selectedDk]: log }))}
          onTogglePeriodStart={() => {
            const dk = selectedDk;
            setStarts((prev) => prev.includes(dk) ? prev.filter((d) => d !== dk) : [...prev, dk].sort());
          }}
          onClose={() => setSelectedDk(null)}
        />
      )}
    </div>
  );
}
