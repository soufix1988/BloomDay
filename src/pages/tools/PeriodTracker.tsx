import { Droplets, Plus, Trash2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, predictCycle, type PeriodSettings } from "@/data/schemas";
import { dayKey, fromDayKey, prettyDate } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

export default function PeriodTracker() {
  const tool = toolBySlug("period")!;
  const [starts, setStarts] = useBloomState<string[]>(KEYS.periodStarts, []);
  const [settings, setSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, {
    cycleLength: 28,
    periodLength: 5,
  });

  const p = predictCycle(starts, settings);

  const logToday = () =>
    setStarts((prev) => (prev.includes(dayKey()) ? prev : [...prev, dayKey()].sort()));

  const remove = (k: string) => setStarts((prev) => prev.filter((d) => d !== k));

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <PopCard className="text-center" >
          <p className="font-script text-2xl text-hot">cycle status</p>
          {p.hasData ? (
            <>
              <div className="mx-auto my-4 grid size-40 place-items-center rounded-full border-8 border-blush" style={{ borderTopColor: tool.accent }}>
                <div>
                  <div className="text-5xl font-black text-foreground">{p.cycleDay}</div>
                  <div className="text-xs font-bold text-muted-foreground">cycle day</div>
                </div>
              </div>
              <span className="inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-primary">
                {p.phase}
              </span>
            </>
          ) : (
            <p className="py-12 text-muted-foreground">Log your period start to see predictions 🌸</p>
          )}
          <button onClick={logToday} className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-pink px-6 py-3 font-bold text-primary-foreground shadow-pink hover:scale-105 transition">
            <Droplets className="size-5" /> Log period today
          </button>
        </PopCard>

        <div className="flex flex-col gap-5">
          {p.hasData && (
            <div className="grid grid-cols-2 gap-3">
              <SoftCard className="!p-4 text-center">
                <p className="text-xs font-bold uppercase text-muted-foreground">Next period</p>
                <p className="text-lg font-black text-hot">{p.nextPeriod && prettyDate(p.nextPeriod)}</p>
                <p className="text-xs text-secondary-foreground">in {p.daysUntilNext} days</p>
              </SoftCard>
              <SoftCard className="!p-4 text-center">
                <p className="text-xs font-bold uppercase text-muted-foreground">Ovulation</p>
                <p className="text-lg font-black text-primary">{p.ovulation && prettyDate(p.ovulation)}</p>
                <p className="text-xs text-secondary-foreground">
                  fertile {p.fertileStart && prettyDate(p.fertileStart).split(" ")[1]}–{p.fertileEnd && prettyDate(p.fertileEnd).split(" ")[1]}
                </p>
              </SoftCard>
            </div>
          )}

          <SoftCard>
            <p className="mb-3 text-sm font-bold text-secondary-foreground">Settings</p>
            <label className="mb-3 block text-xs font-bold text-secondary-foreground">
              Avg cycle length: <span className="text-primary">{settings.cycleLength} days</span>
              <input type="range" min={21} max={40} value={settings.cycleLength}
                onChange={(e) => setSettings((s) => ({ ...s, cycleLength: Number(e.target.value) }))}
                className="mt-1 w-full accent-primary" />
            </label>
            <label className="block text-xs font-bold text-secondary-foreground">
              Period length: <span className="text-primary">{settings.periodLength} days</span>
              <input type="range" min={2} max={10} value={settings.periodLength}
                onChange={(e) => setSettings((s) => ({ ...s, periodLength: Number(e.target.value) }))}
                className="mt-1 w-full accent-primary" />
            </label>
          </SoftCard>
        </div>
      </div>

      <SoftCard className="mt-5">
        <p className="mb-3 text-sm font-bold text-secondary-foreground">Logged periods</p>
        {starts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No periods logged yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {[...starts].reverse().map((k) => (
              <li key={k} className="flex items-center gap-2 rounded-full bg-blush px-3 py-1.5 text-sm font-bold text-primary">
                <Plus className="size-3" /> {prettyDate(fromDayKey(k))}
                <button onClick={() => remove(k)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </div>
  );
}
