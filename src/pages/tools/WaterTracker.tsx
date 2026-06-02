import { GlassWater, Minus, Plus, Settings2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS } from "@/data/schemas";
import { dayKey, lastNDays, fromDayKey, prettyDate } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

export default function WaterTracker() {
  const tool = toolBySlug("water")!;
  const today = dayKey();
  const [log, setLog] = useBloomState<Record<string, number>>(KEYS.waterLog, {});
  const [goal, setGoal] = useBloomState<number>(KEYS.waterGoal, 8);

  const count = log[today] ?? 0;
  const pct = Math.min(100, Math.round((count / goal) * 100));

  const change = (delta: number) =>
    setLog((prev) => ({
      ...prev,
      [today]: Math.max(0, (prev[today] ?? 0) + delta),
    }));

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <PopCard className="text-center">
          <p className="font-script text-2xl text-hot">today's hydration</p>
          <div className="relative mx-auto my-4 grid size-44 place-items-center">
            <svg viewBox="0 0 120 120" className="size-44 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--blush)" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke={tool.accent}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset .5s ease" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-black text-foreground">{count}</div>
              <div className="text-xs font-bold text-muted-foreground">of {goal} glasses</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => change(-1)} className="size-12 grid place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition">
              <Minus className="size-5" />
            </button>
            <button onClick={() => change(1)} className="flex items-center gap-2 rounded-full bg-gradient-pink px-7 py-3 font-bold text-primary-foreground shadow-pink hover:scale-105 transition">
              <GlassWater className="size-5" /> Add glass
            </button>
            <button onClick={() => change(1)} aria-hidden className="size-12 grid place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition">
              <Plus className="size-5" />
            </button>
          </div>
          {pct >= 100 && <p className="mt-4 font-bold text-hot">🎉 Goal smashed, stay glowing!</p>}
        </PopCard>

        <div className="flex flex-col gap-5">
          <SoftCard>
            <div className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
              <Settings2 className="size-4" /> Daily goal
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range" min={1} max={16} value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-10 text-right font-black text-primary">{goal}</span>
            </div>
          </SoftCard>

          <SoftCard>
            <p className="mb-3 text-sm font-bold text-secondary-foreground">Last 7 days</p>
            <div className="flex items-end justify-between gap-2 h-28">
              {lastNDays(7).map((k) => {
                const v = log[k] ?? 0;
                const h = Math.min(100, (v / goal) * 100);
                return (
                  <div key={k} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t-lg" style={{ height: `${h}%`, background: tool.accent, minHeight: v ? 6 : 0 }} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {prettyDate(fromDayKey(k)).split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
