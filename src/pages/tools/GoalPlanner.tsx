import { useState } from "react";
import { Minus, Plus, Trash2, Trophy } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, type Goal } from "@/data/schemas";
import { fromDayKey, daysBetween, prettyDate } from "@/lib/date";
import { uid } from "@/lib/id";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

const EMOJIS = ["✨", "💪", "📚", "💰", "🏃", "🎯", "🌱", "🧘", "✈️", "💼"];

export default function GoalPlanner() {
  const tool = toolBySlug("goals")!;
  const [goals, setGoals] = useBloomState<Goal[]>(KEYS.goals, []);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [deadline, setDeadline] = useState("");

  const add = () => {
    const t = parseFloat(target);
    if (!title.trim() || !t || t <= 0) return;
    setGoals((prev) => [
      ...prev,
      { id: uid(), title: title.trim(), emoji, current: 0, target: t, unit: unit.trim() || "", deadline: deadline || undefined },
    ]);
    setTitle(""); setTarget(""); setUnit(""); setDeadline(""); setEmoji(EMOJIS[0]);
  };

  const bump = (id: string, delta: number) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, current: Math.max(0, Math.min(g.target, g.current + delta)) } : g,
      ),
    );
  const remove = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  return (
    <div>
      <ToolHeader tool={tool} />

      <PopCard className="mb-5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-1">
            {EMOJIS.slice(0, 6).map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className={`size-9 rounded-xl text-lg ${emoji === e ? "bg-blush scale-110" : "bg-secondary/50"}`}>{e}</button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal, e.g. Read books" className="min-w-40 flex-1 rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className="w-24 rounded-2xl border-2 border-secondary bg-blush/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="w-24 rounded-2xl border-2 border-secondary bg-blush/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-2xl border-2 border-secondary bg-blush/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={add} className="flex items-center gap-1 rounded-2xl bg-gradient-pink px-5 py-2.5 font-bold text-primary-foreground shadow-soft hover:scale-105 transition">
            <Plus className="size-4" /> Add
          </button>
        </div>
      </PopCard>

      {goals.length === 0 ? (
        <SoftCard className="text-center text-muted-foreground">No goals yet — dream big and add your first ✨</SoftCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.round((g.current / g.target) * 100);
            const done = pct >= 100;
            const daysLeft = g.deadline ? daysBetween(new Date(), fromDayKey(g.deadline)) : null;
            return (
              <SoftCard key={g.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{g.emoji}</span>
                    <div>
                      <p className="font-bold text-foreground">{g.title}</p>
                      {g.deadline && (
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} days left · ` : "overdue · "}
                          {prettyDate(fromDayKey(g.deadline))}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-blush">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: done ? "#22c55e" : tool.accent }} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    {done ? (
                      <span className="flex items-center gap-1 text-[#22c55e]"><Trophy className="size-4" /> Achieved!</span>
                    ) : (
                      <>{g.current} / {g.target} {g.unit}</>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => bump(g.id, -1)} className="size-8 grid place-items-center rounded-full bg-secondary"><Minus className="size-4" /></button>
                    <button onClick={() => bump(g.id, 1)} className="size-8 grid place-items-center rounded-full bg-gradient-pink text-primary-foreground"><Plus className="size-4" /></button>
                  </div>
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
