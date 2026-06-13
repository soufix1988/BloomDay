import { useState } from "react";
import { Droplets, Settings2, ChevronLeft, ChevronRight, X, Sparkles, Plus, Trash2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import {
  KEYS, PHASES, PHASE_TIPS, predictCycle, phaseForCycleDay,
  type PeriodSettings, type CycleDayLog,
} from "@/data/schemas";
import { dayKey, fromDayKey, daysBetween, prettyDate } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

const FLOWS = [
  { id: "spotting", label: "Spotting", emoji: "💧" },
  { id: "light", label: "Light", emoji: "🩸" },
  { id: "medium", label: "Medium", emoji: "🩸🩸" },
  { id: "heavy", label: "Heavy", emoji: "🩸🩸🩸" },
] as const;

const MOODS_CHIPS = ["Happy", "Anxious", "Irritable", "Sensitive", "Calm", "Energized"];
const BODY_CHIPS = ["Cramps", "Bloating", "Headache", "Tender", "Fatigue", "Clear"];
const SKIN_CHIPS = ["Glowing", "Oily", "Dry", "Breakout", "Normal"];
const ENERGY_CHIPS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
] as const;

/** Cycle-day & phase for any date, based on the nearest prior logged start. */
function dayInfo(key: string, sortedStarts: string[], cycleLength: number, periodLength: number) {
  let prevStart: string | undefined;
  for (const s of sortedStarts) {
    if (s <= key) prevStart = s;
    else break;
  }
  if (!prevStart) return null;
  const raw = daysBetween(fromDayKey(prevStart), fromDayKey(key)) + 1;
  const cycleDay = ((raw - 1) % cycleLength) + 1;
  const isLoggedPeriod = sortedStarts.includes(key) || (raw >= 1 && raw <= periodLength);
  const phaseKey = phaseForCycleDay(cycleDay, { cycleLength, periodLength });
  return { cycleDay, phaseKey, isLoggedPeriod };
}

function toggleInArray(arr: string[] | undefined, value: string): string[] {
  const cur = arr ?? [];
  return cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
}

export default function PeriodTracker() {
  const tool = toolBySlug("period")!;
  const today = dayKey();
  const [starts, setStarts] = useBloomState<string[]>(KEYS.periodStarts, []);
  const [settings, setSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, {
    cycleLength: 28,
    periodLength: 5,
  });
  const [logs, setLogs] = useBloomState<Record<string, CycleDayLog>>(KEYS.periodLogs, {});
  const [showSettings, setShowSettings] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const p = predictCycle(starts, settings);
  const sortedStarts = [...starts].sort();
  const todayLog = logs[today] ?? {};

  const logToday = () =>
    setStarts((prev) => (prev.includes(today) ? prev : [...prev, today].sort()));

  const removeStart = (k: string) => setStarts((prev) => prev.filter((d) => d !== k));

  const setLog = (patch: Partial<CycleDayLog>) =>
    setLogs((prev) => ({ ...prev, [today]: { ...prev[today], ...patch } }));

  const phaseInfo = p.hasData ? PHASES[p.phaseKey] : null;
  const tipIdx = p.hasData
    ? (fromDayKey(today).getDate() + p.cycleDay) % PHASE_TIPS[p.phaseKey].length
    : 0;
  const tip = p.hasData ? PHASE_TIPS[p.phaseKey][tipIdx] : null;

  // PMS forecast: are we within 4 days of the next period (and not already in it)?
  const pmsSoon = p.hasData && p.phaseKey === "luteal" && (p.daysUntilNext ?? 99) <= 4 && (p.daysUntilNext ?? 0) > 0;

  /* ---------------- Calendar ---------------- */
  const baseMonth = new Date();
  baseMonth.setDate(1);
  baseMonth.setMonth(baseMonth.getMonth() + monthOffset);
  const monthLabel = baseMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstWeekday = baseMonth.getDay();
  const daysInMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0).getDate();
  const calCells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      dayKey(new Date(baseMonth.getFullYear(), baseMonth.getMonth(), i + 1)),
    ),
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <ToolHeader tool={tool} />
        <button
          onClick={() => setShowSettings(true)}
          className="mb-6 grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground shadow-soft transition hover:text-primary"
          aria-label="Cycle settings"
        >
          <Settings2 className="size-5" />
        </button>
      </div>

      {/* ---------------- Today's phase hero ---------------- */}
      <PopCard
        className="mb-5 !text-white"
        style={{ background: p.hasData ? `linear-gradient(135deg, ${phaseInfo!.color}, ${phaseInfo!.color}cc)` : undefined }}
      >
        {p.hasData ? (
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="font-script text-2xl">Day {p.cycleDay}</p>
              <h2 className="font-display text-3xl">{phaseInfo!.emoji} {p.phase}</h2>
              <p className="mt-1 text-sm text-white/85">{phaseInfo!.vibe}</p>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[260px]">
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Next period</p>
                <p className="text-lg font-black">{p.nextPeriod && prettyDate(p.nextPeriod)}</p>
                <p className="text-xs text-white/80">in {p.daysUntilNext} days</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Ovulation</p>
                <p className="text-lg font-black">{p.ovulation && prettyDate(p.ovulation)}</p>
                <p className="text-xs text-white/80">
                  fertile {p.fertileStart && prettyDate(p.fertileStart).split(" ")[1]}–{p.fertileEnd && prettyDate(p.fertileEnd).split(" ")[1]}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="font-script text-2xl text-hot">cycle status</p>
            <p className="mt-2 text-muted-foreground">Log your period start to see your phase, predictions & tips 🌸</p>
          </div>
        )}
        <div className="mt-4 flex justify-center sm:justify-start">
          <button
            onClick={logToday}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-soft transition hover:scale-105 ${
              p.hasData ? "bg-white/20 text-white" : "bg-gradient-pink text-primary-foreground shadow-pink"
            }`}
          >
            <Droplets className="size-5" /> {starts.includes(today) ? "Logged today ✓" : "Log period today"}
          </button>
        </div>
      </PopCard>

      {/* PMS forecast banner */}
      {pmsSoon && (
        <SoftCard className="mb-5 !border-[#a87ad8]/40 bg-[#a87ad8]/10">
          <p className="flex items-center gap-2 text-sm font-bold text-[#a87ad8]">
            <Sparkles className="size-4" /> Your PMS window starts in {p.daysUntilNext} day{p.daysUntilNext === 1 ? "" : "s"} — be extra soft with yourself 💕
          </p>
        </SoftCard>
      )}

      {/* Phase tip */}
      {tip && (
        <SoftCard className="mb-5">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <span className="text-lg">💡</span> {tip}
          </p>
        </SoftCard>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        {/* ---------------- Daily symptom logger ---------------- */}
        <SoftCard>
          <p className="mb-3 font-script text-xl text-hot">how are you feeling today?</p>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Flow</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {FLOWS.map((f) => (
              <button
                key={f.id}
                onClick={() => setLog({ flow: todayLog.flow === f.id ? undefined : f.id })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  todayLog.flow === f.id ? "bg-gradient-pink text-primary-foreground" : "bg-blush/60 text-secondary-foreground"
                }`}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Mood</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {MOODS_CHIPS.map((m) => (
              <button
                key={m}
                onClick={() => setLog({ mood: toggleInArray(todayLog.mood, m) })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  todayLog.mood?.includes(m) ? "bg-gradient-pink text-primary-foreground" : "bg-blush/60 text-secondary-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Body</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {BODY_CHIPS.map((b) => (
              <button
                key={b}
                onClick={() => setLog({ body: toggleInArray(todayLog.body, b) })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  todayLog.body?.includes(b) ? "bg-gradient-pink text-primary-foreground" : "bg-blush/60 text-secondary-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Skin</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SKIN_CHIPS.map((s) => (
              <button
                key={s}
                onClick={() => setLog({ skin: todayLog.skin === s ? undefined : s })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  todayLog.skin === s ? "bg-gradient-pink text-primary-foreground" : "bg-blush/60 text-secondary-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Energy</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {ENERGY_CHIPS.map((e) => (
              <button
                key={e.id}
                onClick={() => setLog({ energy: todayLog.energy === e.id ? undefined : e.id })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  todayLog.energy === e.id ? "bg-gradient-pink text-primary-foreground" : "bg-blush/60 text-secondary-foreground"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Note</p>
          <textarea
            value={todayLog.note ?? ""}
            onChange={(e) => setLog({ note: e.target.value })}
            placeholder="Anything else? 🌷"
            rows={2}
            className="w-full resize-none rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </SoftCard>

        {/* ---------------- Calendar ---------------- */}
        <SoftCard>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="grid size-8 place-items-center rounded-xl bg-blush/60 text-secondary-foreground">
              <ChevronLeft className="size-4" />
            </button>
            <p className="font-script text-xl text-hot">{monthLabel}</p>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="grid size-8 place-items-center rounded-xl bg-blush/60 text-secondary-foreground">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calCells.map((k, i) => {
              if (!k) return <div key={i} />;
              const info = dayInfo(k, sortedStarts, settings.cycleLength, settings.periodLength);
              const isToday = k === today;
              const bg = info ? (info.isLoggedPeriod ? PHASES.menstrual.color : `${PHASES[info.phaseKey].color}33`) : "transparent";
              const fg = info?.isLoggedPeriod ? "#fff" : "var(--foreground)";
              return (
                <div
                  key={i}
                  className={`grid aspect-square place-items-center rounded-xl text-[11px] font-bold ${isToday ? "ring-2 ring-primary" : ""}`}
                  style={{ background: bg, color: fg }}
                >
                  {Number(k.slice(-2))}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
            {Object.entries(PHASES).map(([key, ph]) => (
              <span key={key} className="flex items-center gap-1">
                <span className="size-2.5 rounded-full" style={{ background: ph.color }} /> {ph.name}
              </span>
            ))}
          </div>
        </SoftCard>
      </div>

      {/* ---------------- History ---------------- */}
      <SoftCard className="mt-5">
        <p className="mb-3 text-sm font-bold text-secondary-foreground">Logged periods</p>
        {starts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No periods logged yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {[...starts].reverse().map((k) => (
              <li key={k} className="flex items-center gap-2 rounded-full bg-blush px-3 py-1.5 text-sm font-bold text-primary">
                <Plus className="size-3" /> {prettyDate(fromDayKey(k))}
                <button onClick={() => removeStart(k)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>

      {/* ---------------- Settings drawer ---------------- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setShowSettings(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-pink sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-script text-2xl text-hot">cycle settings</p>
              <button onClick={() => setShowSettings(false)} className="grid size-8 place-items-center rounded-xl bg-blush/60 text-secondary-foreground">
                <X className="size-4" />
              </button>
            </div>
            <label className="mb-4 block text-xs font-bold text-secondary-foreground">
              Average cycle length: <span className="text-primary">{settings.cycleLength} days</span>
              <input type="range" min={21} max={40} value={settings.cycleLength}
                onChange={(e) => setSettings((s) => ({ ...s, cycleLength: Number(e.target.value) }))}
                className="mt-1 w-full accent-primary" />
            </label>
            <label className="mb-2 block text-xs font-bold text-secondary-foreground">
              Period length: <span className="text-primary">{settings.periodLength} days</span>
              <input type="range" min={2} max={10} value={settings.periodLength}
                onChange={(e) => setSettings((s) => ({ ...s, periodLength: Number(e.target.value) }))}
                className="mt-1 w-full accent-primary" />
            </label>
            <button
              onClick={() => setShowSettings(false)}
              className="mt-5 w-full rounded-full bg-gradient-pink px-6 py-3 text-center font-bold text-primary-foreground shadow-pink transition hover:scale-105"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
