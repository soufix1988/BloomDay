import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Heart, Sparkles, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useBloomState } from "@/hooks/useBloomState";
import {
  KEYS,
  type PeriodSettings,
  type CycleDayLog,
  type MoodEntry,
  type CycleGoal,
  type CycleUserPrefs,
} from "@/data/schemas";
import { dayKey, fromDayKey, daysBetween, addDays } from "@/lib/date";

type PhaseName = "menstrual" | "follicular" | "ovulatory" | "luteal";

const PHASES: Record<PhaseName, { label: string; emoji: string; bg: string; calBg: string; accent: string; desc: string }> = {
  menstrual:  { label: "Menstrual",  emoji: "🩸", bg: "#ffe4e6", calBg: "#fda4af", accent: "#f43f5e", desc: "Flow & rest"  },
  follicular: { label: "Follicular", emoji: "🌱", bg: "#dcfce7", calBg: "#6ee7b7", accent: "#10b981", desc: "Rise & glow"  },
  ovulatory:  { label: "Ovulatory",  emoji: "🌸", bg: "#f3e8ff", calBg: "#d8b4fe", accent: "#9333ea", desc: "Peak energy"  },
  luteal:     { label: "Luteal",     emoji: "🌙", bg: "#dbeafe", calBg: "#7dd3fc", accent: "#0ea5e9", desc: "Wind down"    },
};

const PHASE_ORDER: PhaseName[] = ["menstrual", "follicular", "ovulatory", "luteal"];

const PHASE_WELLNESS: Record<PhaseName, { energy: string; workout: string; nutrition: string; ritual: string; affirmation: string }> = {
  menstrual:  { energy: "Low — honor your need for rest",      workout: "Gentle yoga or light stretching",   nutrition: "Iron-rich: spinach, lentils, dark chocolate", ritual: "Warm bath, heating pad, cozy blanket",          affirmation: "I honor my body's natural rhythm 🌙" },
  follicular: { energy: "Rising — fresh ideas are blooming",   workout: "Light cardio, dance, pilates",       nutrition: "Probiotic: yogurt, kimchi, flaxseeds",        ritual: "Try something new, journal your dreams",        affirmation: "I am blooming with possibilities 🌱" },
  ovulatory:  { energy: "Peak — you are radiant today",        workout: "HIIT, strength training, running",   nutrition: "Antioxidant-rich: berries, leafy greens",     ritual: "Social plans, creative projects, speak up",     affirmation: "I shine at my fullest brightness 🌸" },
  luteal:     { energy: "Slowing — turn inward with kindness", workout: "Walking, gentle swimming, yin yoga", nutrition: "Magnesium-rich: nuts, seeds, dark chocolate",  ritual: "Limit caffeine, mindful breathing, early rest", affirmation: "I release and make space for renewal 🌙" },
};

const GOALS: Array<{ value: CycleGoal; emoji: string; label: string; desc: string; color: string }> = [
  { value: "regular",  emoji: "🌸", label: "Regular",  desc: "Track your cycle & daily wellbeing",   color: "#ec6f9e" },
  { value: "conceive", emoji: "🌺", label: "Conceive", desc: "Highlight fertile window & best days",  color: "#10b981" },
  { value: "avoid",    emoji: "🛡️", label: "Prevent",  desc: "Identify safe days & avoid pregnancy", color: "#9333ea" },
];

const DEFAULT_PREFS: CycleUserPrefs = { goal: "regular", showMood: true, showSex: true, showOvulation: true };

const SYMPTOMS = ["cramps", "bloating", "fatigue", "headache", "acne", "back pain", "mood swings"];
const FLOW = ["spotting", "light", "medium", "heavy"] as const;
const MOOD_EMOJIS  = ["😢", "😟", "😐", "🙂", "😄"];
const MOOD_LABELS  = ["Awful", "Low", "Okay", "Good", "Great"];
const DAY_HEADERS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  return ((daysBetween(lastStart, new Date())) % cl) + 1;
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

function computeHealthScore(starts: string[], settings: PeriodSettings, dayLogs: Record<string, CycleDayLog>): number {
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
    reg = Math.max(0, Math.round(40 - (diffs.reduce((s, d) => s + Math.abs(d - avg), 0) / diffs.length) * 4));
  }
  const daysSince = Math.min(daysBetween(lastStart, new Date()) + 1, cl);
  let logged = 0;
  for (let i = 0; i < daysSince; i++) {
    const l = dayLogs[dayKey(addDays(lastStart, i))];
    if (l && (l.flow || l.mood || l.sex || (l.symptoms?.length ?? 0) > 0)) logged++;
  }
  const withSym = Object.values(dayLogs).filter((l) => l.symptoms?.length);
  const avgSym = withSym.length > 0 ? withSym.reduce((s, l) => s + (l.symptoms?.length ?? 0), 0) / withSym.length : 0;
  return Math.min(100, reg + (daysSince > 0 ? Math.round((logged / daysSince) * 40) : 0) + Math.max(0, Math.round(20 - avgSym * 3)));
}

function computeMoodByPhase(moodEntries: Record<string, MoodEntry>, starts: string[], settings: PeriodSettings): Record<PhaseName, { sum: number; count: number }> {
  const out: Record<PhaseName, { sum: number; count: number }> = {
    menstrual: { sum: 0, count: 0 }, follicular: { sum: 0, count: 0 },
    ovulatory: { sum: 0, count: 0 }, luteal:     { sum: 0, count: 0 },
  };
  Object.entries(moodEntries).forEach(([dk, entry]) => {
    const phase = phaseForDate(fromDayKey(dk), starts, settings);
    if (phase) { out[phase].sum += entry.mood; out[phase].count++; }
  });
  return out;
}

function computeSymptomPatterns(dayLogs: Record<string, CycleDayLog>, starts: string[], settings: PeriodSettings): Array<{ symptom: string; phase: PhaseName; total: number }> {
  const counts: Record<string, Partial<Record<PhaseName, number>>> = {};
  Object.entries(dayLogs).forEach(([dk, log]) => {
    if (!log.symptoms?.length) return;
    const phase = phaseForDate(fromDayKey(dk), starts, settings);
    if (!phase) return;
    log.symptoms.forEach((s) => { if (!counts[s]) counts[s] = {}; counts[s][phase] = (counts[s][phase] ?? 0) + 1; });
  });
  return Object.entries(counts).map(([symptom, phases]) => {
    const total = Object.values(phases).reduce((a, b) => a + b, 0);
    const topPhase = (Object.entries(phases) as [PhaseName, number][]).sort((a, b) => b[1] - a[1])[0][0];
    return { symptom, phase: topPhase, total };
  }).sort((a, b) => b.total - a.total).slice(0, 4);
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative h-7 w-12 rounded-full transition-all duration-300 shrink-0 ${on ? "bg-gradient-pink shadow-pink" : "bg-blush"}`}>
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// ── Mini Calendar Picker ──────────────────────────────────────────────────────

function MiniCalendarPicker({ selectedKey, onSelect, maxKey }: {
  selectedKey: string | null; onSelect: (dk: string) => void; maxKey?: string;
}) {
  const now = new Date();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevM = () => { if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1); };
  const nextM = () => { if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1); };

  return (
    <div className="rounded-2xl bg-blush p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prevM} className="rounded-full p-1.5 hover:bg-white/60 transition"><ChevronLeft className="size-4" /></button>
        <span className="text-sm font-bold text-foreground">{monthLabel}</span>
        <button onClick={nextM} className="rounded-full p-1.5 hover:bg-white/60 transition"><ChevronRight className="size-4" /></button>
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
          const disabled = maxKey ? dk > maxKey : false;
          const selected = dk === selectedKey;
          return (
            <button key={i} disabled={disabled} onClick={() => onSelect(dk)}
              className={`aspect-square rounded-xl text-xs font-bold transition ${
                selected ? "bg-gradient-pink text-primary-foreground shadow-pink"
                : disabled ? "cursor-default text-muted-foreground/25"
                : "text-foreground hover:bg-white/70"
              }`}>{date.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Settings Modal (centered popup) ──────────────────────────────────────────

function SettingsModal({ prefs, settings, starts, onSave, onClose }: {
  prefs: CycleUserPrefs; settings: PeriodSettings; starts: string[];
  onSave: (p: CycleUserPrefs, s: PeriodSettings, lastStart: string | null) => void;
  onClose: () => void;
}) {
  const todayStr = dayKey();
  const lastStart = starts.length > 0 ? [...starts].sort()[starts.length - 1] : null;
  const [goal, setGoal]               = useState<CycleGoal>(prefs.goal);
  const [showMood, setShowMood]       = useState(prefs.showMood);
  const [showSex, setShowSex]         = useState(prefs.showSex);
  const [showOvul, setShowOvul]       = useState(prefs.showOvulation);
  const [cycleLen, setCycleLen]       = useState(settings.cycleLength);
  const [periodLen, setPeriodLen]     = useState(settings.periodLength);
  const [selStart, setSelStart]       = useState<string | null>(lastStart);

  const save = () => {
    onSave({ goal, showMood, showSex, showOvulation: showOvul }, { cycleLength: cycleLen, periodLength: periodLen }, selStart);
    onClose();
  };

  const selLabel = selStart
    ? fromDayKey(selStart).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })
    : "Not set";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-background shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-pink px-6 py-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full bg-sunburst opacity-20 animate-spin-slow" />
          <Sparkles className="absolute top-4 right-16 size-4 animate-sparkle opacity-70" />
          <Heart className="absolute bottom-3 left-20 size-3 fill-current animate-float opacity-60" style={{ animationDelay: "1s" }} />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-script text-xl opacity-90">personalize your</p>
              <h2 className="font-display text-3xl">Cycle Settings</h2>
            </div>
            <button onClick={onClose} className="mt-1 rounded-full p-2 bg-white/20 hover:bg-white/40 transition">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[72dvh] overflow-y-auto">

          {/* Goal */}
          <div className="px-5 pt-5 pb-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tracking Goal</p>
            <div className="flex flex-col gap-2.5">
              {GOALS.map((g) => {
                const active = goal === g.value;
                return (
                  <button key={g.value} onClick={() => setGoal(g.value)}
                    className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all border-2 ${
                      active ? "border-transparent shadow-pink" : "border-border bg-card hover:border-primary/30"
                    }`}
                    style={active ? { background: `linear-gradient(135deg, ${g.color}22, ${g.color}11)`, borderColor: g.color } : {}}>
                    <span className={`text-3xl transition ${active ? "scale-110 drop-shadow-md" : "scale-95"}`}>{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg" style={{ color: active ? g.color : undefined }}>{g.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{g.desc}</p>
                    </div>
                    <div className="size-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: active ? g.color : "#e5e7eb" }}>
                      {active && <div className="size-2 rounded-full" style={{ background: g.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-5 border-t border-border" />

          {/* Cycle dates */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Your Cycle</p>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Last period started</p>
              <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-primary">{selLabel}</span>
            </div>
            <div className="mb-4">
              <MiniCalendarPicker selectedKey={selStart} onSelect={setSelStart} maxKey={todayStr} />
            </div>
            <div className="space-y-4 rounded-2xl bg-blush p-4">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">Cycle length</span>
                  <span className="rounded-full bg-gradient-pink px-3 py-0.5 text-xs font-black text-primary-foreground">{cycleLen} days</span>
                </div>
                <input type="range" min={21} max={40} value={cycleLen}
                  onChange={(e) => setCycleLen(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">21 days</span>
                  <span className="text-[10px] text-muted-foreground">40 days</span>
                </div>
              </label>
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">Bleeding duration</span>
                  <span className="rounded-full bg-rose-400 px-3 py-0.5 text-xs font-black text-white">{periodLen} days</span>
                </div>
                <input type="range" min={2} max={10} value={periodLen}
                  onChange={(e) => setPeriodLen(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">2 days</span>
                  <span className="text-[10px] text-muted-foreground">10 days</span>
                </div>
              </label>
            </div>
          </div>

          <div className="mx-5 border-t border-border" />

          {/* What to track */}
          <div className="px-5 py-4 pb-5">
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">What to Track</p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              {([
                { emoji: "😊", label: "Mood",            sub: "Daily emotional check-in",      on: showMood, set: setShowMood },
                { emoji: "💕", label: "Intimacy",         sub: "Protected / unprotected sex",   on: showSex,  set: setShowSex  },
                { emoji: "🌸", label: "Ovulation signs",  sub: "Log fertile signs",             on: showOvul, set: setShowOvul },
              ] as { emoji: string; label: string; sub: string; on: boolean; set: (fn: (v: boolean) => boolean) => void }[]).map(
                ({ emoji, label, sub, on, set }, idx, arr) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${idx < arr.length - 1 ? "border-b border-border" : ""}`}>
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <Toggle on={on} onToggle={() => set((v) => !v)} />
                  </div>
                )
              )}
            </div>
            {goal === "conceive" && (
              <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex gap-3 items-start">
                <span className="text-lg">🌺</span>
                <p className="text-xs text-emerald-800 font-semibold leading-snug">Conceive mode highlights your fertile window and ovulation on the calendar.</p>
              </div>
            )}
            {goal === "avoid" && (
              <div className="mt-3 rounded-2xl bg-violet-50 border border-violet-200 px-4 py-3 flex gap-3 items-start">
                <span className="text-lg">🛡️</span>
                <p className="text-xs text-violet-800 font-semibold leading-snug">Prevent mode marks unsafe days clearly so you can plan accordingly.</p>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="border-t border-border bg-card px-5 py-4">
          <button onClick={save}
            className="w-full rounded-full bg-gradient-pink py-3.5 font-bold text-primary-foreground shadow-pink transition hover:scale-[1.02] text-base">
            Save Settings 🌸
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onboarding Modal ──────────────────────────────────────────────────────────

function OnboardingModal({ onSave, onClose }: {
  onSave: (firstDay: string, s: PeriodSettings) => void; onClose: () => void;
}) {
  const todayStr = dayKey();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-[2rem] bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-pink px-6 py-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-8 -right-8 size-24 rounded-full bg-sunburst opacity-20 animate-spin-slow" />
          <Sparkles className="absolute top-3 right-10 size-4 animate-sparkle opacity-70" />
          <p className="font-script text-xl opacity-90 relative z-10">let's get started</p>
          <h2 className="font-display text-3xl relative z-10">Your Cycle 🌸</h2>
          <p className="text-sm opacity-80 mt-1 relative z-10">Pick the first day of your last period</p>
        </div>
        <div className="p-5">
          <div className="mb-5">
            <MiniCalendarPicker selectedKey={selectedKey} onSelect={setSelectedKey} maxKey={todayStr} />
          </div>
          <div className="mb-6 space-y-4 rounded-2xl bg-blush p-4">
            <label className="block text-xs font-bold text-secondary-foreground">
              Average cycle length: <span className="text-primary font-black">{cycleLength} days</span>
              <input type="range" min={21} max={40} value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))} className="mt-1 w-full accent-primary" />
            </label>
            <label className="block text-xs font-bold text-secondary-foreground">
              Bleeding duration: <span className="text-primary font-black">{periodLength} days</span>
              <input type="range" min={2} max={10} value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))} className="mt-1 w-full accent-primary" />
            </label>
          </div>
          <button disabled={!selectedKey}
            onClick={() => selectedKey && onSave(selectedKey, { cycleLength, periodLength })}
            className="w-full rounded-full bg-gradient-pink py-3.5 font-bold text-primary-foreground shadow-pink transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40">
            Start Tracking 🌸
          </button>
          <button onClick={onClose} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Log Panel (inline on page, always visible) ────────────────────────────

function DayLogPanel({ dk, phase, log, isPeriodStart, prefs, onChange, onTogglePeriodStart }: {
  dk: string; phase: PhaseName | null; log: CycleDayLog; isPeriodStart: boolean;
  prefs: CycleUserPrefs;
  onChange: (l: CycleDayLog) => void; onTogglePeriodStart: () => void;
}) {
  const ph = phase ? PHASES[phase] : null;
  const label = fromDayKey(dk).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  function toggleSymptom(s: string) {
    const cur = log.symptoms ?? [];
    onChange({ ...log, symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  return (
    <div className="rounded-3xl bg-card border-pop shadow-soft overflow-hidden">

      {/* Card header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: ph ? `linear-gradient(135deg, ${ph.bg}, #fff8fb)` : "#fdf2f8" }}>
        <div>
          <p className="font-display text-lg text-foreground">{label}</p>
          {ph && <p className="text-xs font-bold mt-0.5" style={{ color: ph.accent }}>{ph.emoji} {ph.label} · {ph.desc}</p>}
        </div>
        <span className="text-3xl animate-float" style={{ animationDelay: "0.5s" }}>
          {ph?.emoji ?? "🌸"}
        </span>
      </div>

      <div className="divide-y divide-border/60">

        {/* Period start */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#ffe4e6" }}>
            <span className="text-lg">🩸</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Period start</p>
            <p className="text-xs text-muted-foreground">Mark as first bleeding day</p>
          </div>
          <Toggle on={isPeriodStart} onToggle={onTogglePeriodStart} />
        </div>

        {/* Flow */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fecdd3" }}>
              <span className="text-lg">💧</span>
            </div>
            <p className="text-sm font-bold text-foreground flex-1">Flow intensity</p>
            {log.flow && <span className="text-xs font-bold text-rose-500 capitalize">{log.flow}</span>}
          </div>
          <div className="flex gap-2 pl-14">
            {FLOW.map((f) => (
              <button key={f} onClick={() => onChange({ ...log, flow: log.flow === f ? undefined : f })}
                className={`flex-1 rounded-2xl py-2 text-xs font-bold capitalize transition ${
                  log.flow === f ? "bg-rose-400 text-white shadow-sm scale-105" : "bg-blush text-secondary-foreground hover:bg-rose-100"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Mood */}
        {prefs.showMood && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef9c3" }}>
                <span className="text-lg">{log.mood ? MOOD_EMOJIS[log.mood - 1] : "😊"}</span>
              </div>
              <p className="text-sm font-bold text-foreground flex-1">Mood</p>
              {log.mood && (
                <span className="text-xs font-bold rounded-full px-3 py-1 bg-amber-100 text-amber-700">{MOOD_LABELS[log.mood - 1]}</span>
              )}
            </div>
            <div className="flex justify-between px-2 pl-14">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button key={i} onClick={() => onChange({ ...log, mood: log.mood === i + 1 ? undefined : i + 1 })}
                  className={`text-2xl transition-transform ${log.mood === i + 1 ? "scale-[1.4] drop-shadow-md" : "scale-90 hover:scale-[1.15]"}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fed7aa" }}>
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-sm font-bold text-foreground flex-1">Symptoms</p>
          </div>
          <div className="flex flex-wrap gap-2 pl-14">
            {SYMPTOMS.map((s) => {
              const on = log.symptoms?.includes(s);
              return (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
                    on ? "bg-gradient-pink text-primary-foreground shadow-pink" : "bg-blush text-secondary-foreground hover:bg-pink-100"
                  }`}>{s}</button>
              );
            })}
          </div>
        </div>

        {/* Intimacy */}
        {prefs.showSex && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fce7f3" }}>
                <span className="text-lg">💕</span>
              </div>
              <p className="text-sm font-bold text-foreground flex-1">Intimacy</p>
            </div>
            <div className="flex gap-2 pl-14">
              {(["protected", "unprotected"] as const).map((s) => (
                <button key={s} onClick={() => onChange({ ...log, sex: log.sex === s ? undefined : s })}
                  className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition ${
                    log.sex === s
                      ? s === "protected" ? "bg-emerald-400 text-white scale-105" : "bg-violet-400 text-white scale-105"
                      : "bg-blush text-secondary-foreground hover:bg-pink-100"
                  }`}>{s === "protected" ? "🛡️ Protected" : "💕 Unprotected"}</button>
              ))}
            </div>
          </div>
        )}

        {/* Ovulation */}
        {prefs.showOvulation && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f3e8ff" }}>
              <span className="text-lg">🌸</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Ovulation signs</p>
              <p className="text-xs text-muted-foreground">Fertile signs today</p>
            </div>
            <Toggle on={!!log.ovulation} onToggle={() => onChange({ ...log, ovulation: !log.ovulation })} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PeriodTracker() {
  const [starts, setStarts]   = useBloomState<string[]>(KEYS.periodStarts, []);
  const [settings, setSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, { cycleLength: 28, periodLength: 5 });
  const [dayLogs, setDayLogs] = useBloomState<Record<string, CycleDayLog>>(KEYS.cycleDayLogs, {});
  const [moodEntries]         = useBloomState<Record<string, MoodEntry>>(KEYS.moodEntries, {});
  const [prefs, setPrefs]     = useBloomState<CycleUserPrefs>(KEYS.cycleUserPrefs, DEFAULT_PREFS);

  const today    = new Date();
  const todayStr = dayKey();

  const [vy, setVy]               = useState(today.getFullYear());
  const [vm, setVm]               = useState(today.getMonth());
  const [selectedDk, setSelectedDk] = useState<string>(todayStr);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);

  const hasData     = starts.length > 0;
  const currentPhase = hasData ? phaseForDate(today, starts, settings) : null;
  const cycDay      = hasData ? todayCycleDay(starts, settings) : null;

  const healthScore    = useMemo(() => computeHealthScore(starts, settings, dayLogs), [starts, settings, dayLogs]);
  const moodByPhase    = useMemo(() => computeMoodByPhase(moodEntries, starts, settings), [moodEntries, starts, settings]);
  const symptomPatterns = useMemo(() => computeSymptomPatterns(dayLogs, starts, settings), [dayLogs, starts, settings]);

  const grid       = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevMonth  = () => { if (vm === 0) { setVm(11); setVy((y) => y - 1); } else setVm((m) => m - 1); };
  const nextMonth  = () => { if (vm === 11) { setVm(0); setVy((y) => y + 1); } else setVm((m) => m + 1); };

  const handleOnboardingSave = (firstDay: string, s: PeriodSettings) => {
    setStarts([firstDay]);
    setSettings(s);
    setShowOnboarding(false);
  };

  const handleSettingsSave = (newPrefs: CycleUserPrefs, newSettings: PeriodSettings, lastStart: string | null) => {
    setPrefs(newPrefs);
    setSettings(newSettings);
    if (lastStart) {
      setStarts((prev) => {
        const sorted = [...prev].sort();
        if (sorted.length > 0)
          return [...sorted.slice(0, -1), lastStart].filter((v, i, a) => a.indexOf(v) === i).sort();
        return [lastStart];
      });
    }
  };

  const ph          = currentPhase ? PHASES[currentPhase] : null;
  const w           = currentPhase ? PHASE_WELLNESS[currentPhase] : null;
  const activeGoal  = GOALS.find((g) => g.value === prefs.goal)!;
  const selectedPhase = hasData ? phaseForDate(fromDayKey(selectedDk), starts, settings) : null;

  return (
    <div className="relative -mx-4 sm:-mx-8 -mt-6 sm:-mt-10 overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-dots/70 px-4 sm:px-8 pt-6 pb-10">
        <Sparkles className="absolute top-6 left-6 size-4 text-primary/50 animate-sparkle" />
        <Sparkles className="absolute top-10 right-14 size-5 text-primary animate-sparkle" style={{ animationDelay: ".8s" }} />
        <Heart className="absolute top-24 left-3 size-4 text-hot fill-hot animate-float" style={{ animationDelay: ".5s" }} />
        <Heart className="absolute top-14 right-4 size-3 text-primary fill-primary animate-float" style={{ animationDelay: "1.3s" }} />

        <Link to="/app/tools" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition">
          <ChevronLeft className="size-4" /> All tools
        </Link>

        <div className="relative bg-gradient-hero rounded-[2.5rem] border-pop shadow-pink p-6 sm:p-10 overflow-hidden">
          <div className="absolute -top-20 -right-20 size-56 rounded-full bg-sunburst opacity-25 animate-spin-slow pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-bubble animate-blob opacity-50 pointer-events-none" />
          <Sparkles className="absolute top-5 left-10 size-5 text-primary/60 animate-sparkle" />
          <Heart className="absolute bottom-6 right-12 size-6 text-hot fill-hot animate-float" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-script text-2xl text-hot">know your rhythm</p>
              <h1 className="font-display text-5xl sm:text-6xl text-gradient-pink leading-tight drop-shadow-sm">Cycle 🌸</h1>
              {hasData && ph && cycDay !== null ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-foreground shadow-soft border-pop">
                    {ph.emoji} {ph.label} · Day {cycDay}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: activeGoal.color }}>
                    {activeGoal.emoji} {activeGoal.label}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-sm text-secondary-foreground/80 max-w-xs">Track your cycle, understand your moods & body patterns.</p>
              )}
            </div>
            {/* Settings gear button */}
            <button onClick={() => setShowSettings(true)}
              className="mt-1 shrink-0 size-11 rounded-2xl bg-card/80 border-pop shadow-soft flex items-center justify-center hover:bg-blush transition">
              <Settings2 className="size-5 text-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* ── PHASE HORIZON ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 -mt-5 relative z-10 mb-4">
        <div className="rounded-3xl bg-card border-pop shadow-soft p-4">
          <div className="grid grid-cols-4 gap-2">
            {PHASE_ORDER.map((p, idx) => {
              const pp     = PHASES[p];
              const active = p === currentPhase;
              const isFertile = p === "ovulatory" && (prefs.goal === "conceive" || prefs.goal === "avoid");
              return (
                <div key={p}
                  className={`relative flex flex-col items-center rounded-2xl py-4 transition-all duration-500 overflow-hidden ${
                    active ? "shadow-pink scale-[1.1] ring-2 ring-white/70" : "hover:scale-105 hover:shadow-soft"
                  } ${isFertile && !active ? "ring-2 ring-offset-1" : ""}`}
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${pp.accent}ee, ${pp.accent}bb)`
                      : `linear-gradient(135deg, ${pp.calBg}99, ${pp.bg})`,
                    "--tw-ring-color": prefs.goal === "conceive" ? "#10b981" : "#9333ea",
                  } as React.CSSProperties}
                >
                  {active && (
                    <div className="absolute inset-0 animate-pulse pointer-events-none rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 30%, ${pp.accent}55, transparent 70%)` }} />
                  )}
                  {isFertile && (
                    <span className="absolute -top-1.5 -right-1 text-[8px] font-black rounded-full px-1.5 py-0.5 z-10"
                      style={{ background: prefs.goal === "conceive" ? "#10b981" : "#9333ea", color: "white" }}>
                      {prefs.goal === "conceive" ? "FERTILE" : "AVOID"}
                    </span>
                  )}
                  <span className={`text-2xl leading-none relative z-10 ${active ? "animate-float" : ""}`}
                    style={{ animationDelay: `${idx * 0.3}s` }}>{pp.emoji}</span>
                  <span className="mt-1.5 text-[10px] font-bold leading-none relative z-10"
                    style={{ color: active ? "white" : pp.accent }}>{pp.label}</span>
                  {active && cycDay !== null && (
                    <span className="mt-1 text-[9px] font-bold text-white/90 relative z-10 bg-white/20 rounded-full px-2 py-0.5">
                      Day {cycDay}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CALENDAR ────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-6 bg-checker/70 mb-4">
        <Heart className="absolute bottom-4 left-6 size-3 text-hot/60 fill-hot animate-float" style={{ animationDelay: "1.8s" }} />
        <Sparkles className="absolute top-4 right-8 size-4 text-primary/40 animate-sparkle" style={{ animationDelay: ".6s" }} />

        <div className="relative bg-card rounded-3xl border-pop shadow-pink p-5 overflow-hidden">
          <div className="absolute -bottom-6 -right-6 size-20 rounded-full bg-sunburst opacity-10 animate-spin-slow pointer-events-none" />

          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-full p-2 hover:bg-blush transition"><ChevronLeft className="size-4" /></button>
            <span className="font-display text-xl text-foreground">{monthLabel}</span>
            <button onClick={nextMonth} className="rounded-full p-2 hover:bg-blush transition"><ChevronRight className="size-4" /></button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center">
            {DAY_HEADERS.map((d) => <span key={d} className="text-[10px] font-bold text-muted-foreground">{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, i) => {
              if (!date) return <div key={i} />;
              const dk            = dayKey(date);
              const isToday       = dk === todayStr;
              const isSelected    = dk === selectedDk && !isToday;
              const isPeriodStart = starts.includes(dk);
              const phase         = hasData ? phaseForDate(date, starts, settings) : null;
              const isFuture      = date > today;
              const isFertileDay  = phase === "ovulatory";
              const log           = dayLogs[dk];
              const hasLog        = !!(log?.flow || log?.mood != null || log?.sex || log?.ovulation || (log?.symptoms?.length ?? 0) > 0);
              const fertileRing   = isFertileDay && !isFuture && (prefs.goal === "conceive" || prefs.goal === "avoid");

              return (
                <button key={i}
                  onClick={() => hasData ? setSelectedDk(dk) : setShowOnboarding(true)}
                  className={`relative flex flex-col items-center rounded-2xl py-2 transition-all ${
                    isToday    ? "shadow-pink scale-105" : ""
                  } ${isSelected  ? "ring-2 ring-primary ring-offset-1" : ""
                  } ${fertileRing ? "ring-2 ring-offset-1" : ""
                  } ${hasData ? "hover:scale-110 hover:shadow-sm" : "cursor-pointer"}`}
                  style={{
                    background: isToday
                      ? "var(--color-primary)"
                      : phase
                        ? isFuture ? PHASES[phase].bg : PHASES[phase].calBg
                        : "#fdf2f8",
                    "--tw-ring-color": prefs.goal === "conceive" ? "#10b981" : prefs.goal === "avoid" ? "#9333ea" : "var(--color-primary)",
                  } as React.CSSProperties}
                >
                  {isPeriodStart && !isToday && <span className="absolute right-0 top-0 text-[7px]">🩸</span>}
                  {log?.ovulation && <span className="absolute left-0 top-0 text-[7px]">🌸</span>}
                  <span className={`text-xs font-black ${isToday ? "text-white" : isFuture ? "text-foreground/50" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                  {isToday && <span className="text-[7px] font-bold text-white/90 leading-none">Today</span>}
                  {hasLog && !isToday && (
                    <div className="mt-0.5 flex gap-[2px] flex-wrap justify-center">
                      {log?.flow    && <span className="size-1.5 rounded-full bg-rose-600" />}
                      {log?.mood != null && <span className="size-1.5 rounded-full bg-amber-500" />}
                      {log?.sex     && <span className="size-1.5 rounded-full bg-violet-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          {hasData && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PHASE_ORDER.map((p) => (
                <span key={p} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold text-white"
                  style={{ background: PHASES[p].accent }}>
                  {PHASES[p].emoji} {PHASES[p].label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 rounded-full bg-blush px-2.5 py-1 text-[9px] font-bold text-secondary-foreground">
                <span className="size-1.5 rounded-full bg-rose-600 inline-block" /> flow
                <span className="size-1.5 rounded-full bg-amber-500 inline-block" /> mood
                <span className="size-1.5 rounded-full bg-violet-500 inline-block" /> ♡
              </span>
            </div>
          )}

          {/* CTA when no data */}
          {!hasData && (
            <div className="mt-4 flex flex-col items-center py-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-pink blur-xl opacity-50 animate-pulse" />
                <button onClick={() => setShowOnboarding(true)}
                  className="relative rounded-full bg-gradient-pink px-8 py-4 text-base font-black text-primary-foreground shadow-pink transition hover:scale-110">
                  🌸 Start Log
                </button>
              </div>
              <p className="mt-3 font-script text-lg text-hot">your journey starts here</p>
            </div>
          )}
        </div>
      </section>

      {/* ── DAILY LOG (always visible) ───────────────────────────────────── */}
      {hasData && (
        <section className="px-4 sm:px-8 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-foreground">
              {selectedDk === todayStr
                ? "Today's Log"
                : fromDayKey(selectedDk).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </h2>
            {selectedDk !== todayStr && (
              <button onClick={() => setSelectedDk(todayStr)}
                className="text-xs font-bold text-primary hover:underline transition">
                Back to today
              </button>
            )}
          </div>
          <DayLogPanel
            dk={selectedDk}
            phase={selectedPhase}
            log={dayLogs[selectedDk] ?? {}}
            isPeriodStart={starts.includes(selectedDk)}
            prefs={prefs}
            onChange={(log) => setDayLogs((prev) => ({ ...prev, [selectedDk]: log }))}
            onTogglePeriodStart={() => {
              const dk = selectedDk;
              setStarts((prev) => prev.includes(dk) ? prev.filter((d) => d !== dk) : [...prev, dk].sort());
            }}
          />
        </section>
      )}

      {/* ── PHASE WELLNESS ─────────────────────────────────────────────────── */}
      {hasData && currentPhase && w && ph && (
        <section className="relative px-4 sm:px-8 py-8 mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-sunburst opacity-10 animate-spin-slow pointer-events-none" />
          <Sparkles className="absolute top-6 right-8 size-5 text-primary animate-sparkle" style={{ animationDelay: ".3s" }} />
          <Heart className="absolute top-8 left-4 size-4 text-hot fill-hot animate-float" />
          <Heart className="absolute bottom-6 right-6 size-5 text-primary fill-primary animate-float" style={{ animationDelay: "1.5s" }} />

          <div className="relative bg-gradient-hero rounded-[2rem] border-pop shadow-pink overflow-hidden">
            <div className="px-6 py-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${ph.bg}, #fff8fb)` }}>
              <div className="absolute -right-8 -top-8 size-28 rounded-full opacity-30 animate-blob pointer-events-none" style={{ background: ph.accent }} />
              <div className="relative z-10 flex items-center gap-4">
                <span className="text-5xl">{ph.emoji}</span>
                <div>
                  <p className="font-script text-xl" style={{ color: ph.accent }}>you are in</p>
                  <p className="font-display text-3xl text-foreground">{ph.label} Phase</p>
                  <p className="text-sm font-semibold" style={{ color: ph.accent }}>{w.energy}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              {([
                { label: "Workout 🏃‍♀️", value: w.workout,   full: false },
                { label: "Nutrition 🥗", value: w.nutrition, full: false },
                { label: "Ritual ✨",    value: w.ritual,    full: true  },
              ] as { label: string; value: string; full: boolean }[]).map(({ label, value, full }) => (
                <div key={label} className={`rounded-2xl p-4 ${full ? "col-span-2" : ""}`} style={{ background: ph.bg }}>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold leading-snug text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="px-6 pb-7 text-center">
              <div className="flex justify-center gap-1 mb-2">
                {[0, 1, 2].map((i) => (
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

          <div className="mb-6 text-center">
            <p className="font-script text-2xl text-hot">patterns & progress</p>
            <h2 className="font-display text-3xl sm:text-4xl text-gradient-pink">Your Cycle Story</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            {PHASE_ORDER.some((p) => moodByPhase[p].count > 0) && (
              <div className="bg-card rounded-3xl border-pop shadow-soft p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mood × Cycle</p>
                <div className="flex gap-2">
                  {PHASE_ORDER.map((p) => {
                    const { sum, count } = moodByPhase[p];
                    const pp = PHASES[p];
                    if (count === 0) return (
                      <div key={p} className="flex flex-1 flex-col items-center rounded-2xl py-3" style={{ background: pp.bg }}>
                        <span className="text-xl">{pp.emoji}</span>
                        <span className="mt-1 text-[9px] font-bold text-muted-foreground">—</span>
                      </div>
                    );
                    const avg = sum / count;
                    return (
                      <div key={p} className="flex flex-1 flex-col items-center rounded-2xl py-3" style={{ background: pp.calBg }}>
                        <span className="text-xl">{pp.emoji}</span>
                        <span className="mt-1 text-xl">{MOOD_EMOJIS[Math.round(avg) - 1] ?? "😐"}</span>
                        <span className="text-[9px] font-bold text-white drop-shadow-sm">{avg.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">avg mood per phase</p>
              </div>
            )}

            {/* Symptom Patterns */}
            {symptomPatterns.length > 0 && (
              <div className="bg-card rounded-3xl border-pop shadow-soft p-5 sm:col-span-2">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Symptom Patterns</p>
                <div className="flex flex-col gap-2">
                  {symptomPatterns.map(({ symptom, phase, total }) => (
                    <div key={symptom} className="flex items-center gap-3">
                      <span className="flex-1 rounded-full px-3 py-2 text-xs font-bold capitalize text-white"
                        style={{ background: PHASES[phase].accent }}>{PHASES[phase].emoji} {symptom}</span>
                      <span className="text-xs font-bold" style={{ color: PHASES[phase].accent }}>{PHASES[phase].label}</span>
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
      {showSettings && (
        <SettingsModal
          prefs={prefs} settings={settings} starts={starts}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
