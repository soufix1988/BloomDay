import { useState } from "react";
import { Check, Flame, Plus, Trash2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, currentStreak, type Habit } from "@/data/schemas";
import { dayKey, lastNDays, fromDayKey } from "@/lib/date";
import { uid } from "@/lib/id";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

const EMOJIS = ["💪", "📖", "🧘", "💧", "🥗", "🌙", "🏃", "🎨", "🧹", "💊"];
const COLORS = ["#f43f7e", "#a855f7", "#22c55e", "#f59e0b", "#38bdf8", "#ef4444"];

export default function HabitTracker() {
  const tool = toolBySlug("habits")!;
  const today = dayKey();
  const [habits, setHabits] = useBloomState<Habit[]>(KEYS.habits, []);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  const add = () => {
    if (!name.trim()) return;
    setHabits((prev) => [
      ...prev,
      { id: uid(), name: name.trim(), emoji, color: COLORS[prev.length % COLORS.length], history: {} },
    ]);
    setName("");
  };

  const toggle = (id: string, key: string) =>
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, history: { ...h.history, [key]: !h.history[key] } } : h,
      ),
    );

  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const week = lastNDays(7);

  return (
    <div>
      <ToolHeader tool={tool} />

      <PopCard className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {EMOJIS.slice(0, 6).map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`size-9 rounded-xl text-lg ${emoji === e ? "bg-blush scale-110" : "bg-secondary/50"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New habit, e.g. Drink water"
            className="min-w-40 flex-1 rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={add} className="flex items-center gap-1 rounded-2xl bg-gradient-pink px-5 py-2.5 font-bold text-primary-foreground shadow-soft hover:scale-105 transition">
            <Plus className="size-4" /> Add
          </button>
        </div>
      </PopCard>

      {habits.length === 0 ? (
        <SoftCard className="text-center text-muted-foreground">
          No habits yet — add your first one above to start a streak 🔥
        </SoftCard>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map((h) => {
            const streak = currentStreak(h.history);
            return (
              <SoftCard key={h.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl text-xl" style={{ background: `${h.color}22` }}>
                      {h.emoji}
                    </span>
                    <div>
                      <p className="font-bold text-foreground">{h.name}</p>
                      <p className="flex items-center gap-1 text-xs font-bold" style={{ color: h.color }}>
                        <Flame className="size-3.5" /> {streak} day streak
                      </p>
                    </div>
                  </div>
                  <button onClick={() => remove(h.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex justify-between gap-1.5">
                  {week.map((k) => {
                    const done = !!h.history[k];
                    const isToday = k === today;
                    const label = fromDayKey(k).toLocaleDateString(undefined, { weekday: "narrow" });
                    return (
                      <button
                        key={k}
                        onClick={() => toggle(h.id, k)}
                        className={`flex flex-1 flex-col items-center gap-1`}
                      >
                        <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
                        <span
                          className={`grid aspect-square w-full place-items-center rounded-xl border-2 transition ${
                            isToday ? "border-primary" : "border-transparent"
                          }`}
                          style={{ background: done ? h.color : "var(--blush)" }}
                        >
                          {done && <Check className="size-4 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
