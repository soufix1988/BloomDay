import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Settings2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, type PeriodSettings, type CycleDayLog } from "@/data/schemas";
import { dayKey, fromDayKey, daysBetween } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { SoftCard } from "@/components/common/Card";

// ── Phase config ──────────────────────────────────────────────────────────────

type PhaseName = "menstrual" | "follicular" | "ovulatory" | "luteal";

const PHASES: Record<PhaseName, { label: string; emoji: string; bg: string; accent: string; desc: string }> = {
  menstrual:  { label: "Menstrual",  emoji: "🩸", bg: "#ffe4e6", accent: "#f43f5e", desc: "Flow & rest"  },
  follicular: { label: "Follicular", emoji: "🌱", bg: "#dcfce7", accent: "#16a34a", desc: "Rise & glow"  },
  ovulatory:  { label: "Ovulatory",  emoji: "🌸", bg: "#f3e8ff", accent: "#9333ea", desc: "Peak energy"  },
  luteal:     { label: "Luteal",     emoji: "🌙", bg: "#dbeafe", accent: "#2563eb", desc: "Wind down"    },
};

const PHASE_ORDER: PhaseName[] = ["menstrual", "follicular", "ovulatory", "luteal"];
const SYMPTOMS = ["cramps", "bloating", "fatigue", "headache", "acne", "back pain", "mood swings"];
const FLOW = ["spotting", "light", "medium", "heavy"] as const;
const MOOD_EMOJIS = ["😢", "😟", "😐", "🙂", "😄"];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Pure helpers ──────────────────────────────────────────────────────────────

function calcCycleLength(starts: string[], settings: PeriodSettings): number {
  if (starts.length >= 2) {
    const sorted = [...starts].sort();
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      diffs.push(daysBetween(fromDayKey(sorted[i - 1]), fromDayKey(sorted[i])));
    }
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
  const cycleDay = ((rawDay - 1) % cl) + 1;
  return cyclePhaseForDay(cycleDay, settings, cl);
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
  const offset = (firstDay.getDay() + 6) % 7; // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
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
  const date = fromDayKey(dk);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function toggleSymptom(s: string) {
    const cur = log.symptoms ?? [];
    onChange({
      ...log,
      symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    });
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
              <p className="font-display text-xl text-foreground">{dateLabel}</p>
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

          {/* Period start toggle */}
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
                onClick={() =>
                  onChange({ ...log, flow: log.flow === f ? undefined : f })
                }
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
                onClick={() =>
                  onChange({ ...log, mood: log.mood === i + 1 ? undefined : i + 1 })
                }
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
                onClick={() =>
                  onChange({ ...log, sex: log.sex === s ? undefined : s })
                }
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
    if (vm === 0) { setVm(11); setVy((y) => y - 1); }
    else setVm((m) => m - 1);
  };
  const nextMonth = () => {
    if (vm === 11) { setVm(0); setVy((y) => y + 1); }
    else setVm((m) => m + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        <h2 className="font-script text-3xl text-gradient-pink mb-1">Start your cycle 🌸</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Pick the first day of your last period
        </p>

        {/* Picker calendar */}
        <div className="mb-5 rounded-2xl bg-blush p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-full p-1.5 hover:bg-white/60 transition"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-bold text-foreground">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="rounded-full p-1.5 hover:bg-white/60 transition"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-muted-foreground">
                {d}
              </span>
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
              type="range"
              min={21}
              max={40}
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-bold text-secondary-foreground">
            Bleeding duration:{" "}
            <span className="text-primary">{periodLength} days</span>
            <input
              type="range"
              min={2}
              max={10}
              value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>
        </div>

        <button
          disabled={!selectedKey}
          onClick={() =>
            selectedKey && onSave(selectedKey, { cycleLength, periodLength })
          }
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
              type="range"
              min={21}
              max={40}
              value={settings.cycleLength}
              onChange={(e) =>
                onChange({ ...settings, cycleLength: Number(e.target.value) })
              }
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-bold text-secondary-foreground">
            Bleeding duration:{" "}
            <span className="text-primary">{settings.periodLength} days</span>
            <input
              type="range"
              min={2}
              max={10}
              value={settings.periodLength}
              onChange={(e) =>
                onChange({ ...settings, periodLength: Number(e.target.value) })
              }
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
  const [settings, setSettings] = useBloomState<PeriodSettings>(
    KEYS.periodSettings,
    { cycleLength: 28, periodLength: 5 },
  );
  const [dayLogs, setDayLogs] = useBloomState<Record<string, CycleDayLog>>(
    KEYS.cycleDayLogs,
    {},
  );

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

  const grid = useMemo(() => buildMonthGrid(vy, vm), [vy, vm]);
  const monthLabel = new Date(vy, vm).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (vm === 0) { setVm(11); setVy((y) => y - 1); }
    else setVm((m) => m - 1);
  };
  const nextMonth = () => {
    if (vm === 11) { setVm(0); setVy((y) => y + 1); }
    else setVm((m) => m + 1);
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

      {/* Phase Horizon */}
      <PhaseHorizon currentPhase={currentPhase} cycleDay={cycDay} />

      {/* Calendar */}
      <SoftCard className="relative !p-4">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-full p-1.5 hover:bg-blush transition"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-foreground">{monthLabel}</span>
            {hasData && (
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full p-1 text-muted-foreground hover:bg-blush transition"
                title="Cycle settings"
              >
                <Settings2 className="size-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="rounded-full p-1.5 hover:bg-blush transition"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {DAY_HEADERS.map((d) => (
            <span key={d} className="text-[10px] font-bold text-muted-foreground">
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} />;
            const dk = dayKey(date);
            const isToday = dk === todayStr;
            const isPeriodStart = starts.includes(dk);
            const phase = hasData ? phaseForDate(date, starts, settings) : null;
            const isFuture = date > today;
            const log = dayLogs[dk];
            const hasLog = !!(
              log?.flow || log?.mood || log?.sex || log?.symptoms?.length
            );

            return (
              <button
                key={i}
                onClick={() =>
                  hasData ? setSelectedDk(dk) : setShowOnboarding(true)
                }
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
                  <span className="absolute right-0.5 top-0.5 text-[7px] leading-none">
                    🩸
                  </span>
                )}
                <span
                  className={`text-xs font-bold leading-none ${
                    isToday
                      ? "text-primary"
                      : isFuture
                      ? "text-muted-foreground/60"
                      : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </span>
                {hasLog && (
                  <span className="mt-1 size-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* "Start Log" overlay when no data */}
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-background/70 backdrop-blur-[2px]">
            <button
              onClick={() => setShowOnboarding(true)}
              className="animate-pulse rounded-full bg-gradient-pink px-8 py-4 text-base font-bold text-primary-foreground shadow-pink transition hover:animate-none hover:scale-105"
            >
              🌸 Start Log
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Track your cycle beautifully
            </p>
          </div>
        )}
      </SoftCard>

      {/* Phase legend */}
      {hasData && (
        <div className="mt-3 flex flex-wrap gap-2">
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
            🩸 Period start
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-[10px] font-bold text-muted-foreground">
            • Logged day
          </span>
        </div>
      )}

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal
          onSave={handleOnboardingSave}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {showSettings && (
        <SettingsSheet
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {selectedDk && (
        <DayLogSheet
          dk={selectedDk}
          phase={selectedPhase}
          log={dayLogs[selectedDk] ?? {}}
          isPeriodStart={starts.includes(selectedDk)}
          onChange={(log) =>
            setDayLogs((prev) => ({ ...prev, [selectedDk]: log }))
          }
          onTogglePeriodStart={() => {
            const dk = selectedDk;
            setStarts((prev) =>
              prev.includes(dk)
                ? prev.filter((d) => d !== dk)
                : [...prev, dk].sort(),
            );
          }}
          onClose={() => setSelectedDk(null)}
        />
      )}
    </div>
  );
}
