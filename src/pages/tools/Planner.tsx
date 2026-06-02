import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, type Task } from "@/data/schemas";
import { dayKey, fromDayKey, addDays, prettyDate, isToday } from "@/lib/date";
import { uid } from "@/lib/id";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

const PRIORITIES = {
  high: { label: "High", color: "#f43f7e" },
  med: { label: "Med", color: "#f59e0b" },
  low: { label: "Low", color: "#38bdf8" },
} as const;

export default function Planner() {
  const tool = toolBySlug("planner")!;
  const [tasks, setTasks] = useBloomState<Task[]>(KEYS.tasks, []);
  const [selected, setSelected] = useState(dayKey());
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("med");

  const dayTasks = tasks
    .filter((t) => t.date === selected)
    .sort((a, b) => Number(a.done) - Number(b.done));

  const upcoming = tasks
    .filter((t) => !t.done && t.date > dayKey())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const add = () => {
    if (!title.trim()) return;
    setTasks((prev) => [...prev, { id: uid(), title: title.trim(), date: selected, done: false, priority }]);
    setTitle("");
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const shift = (n: number) => setSelected(dayKey(addDays(fromDayKey(selected), n)));

  const doneCount = dayTasks.filter((t) => t.done).length;

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <PopCard>
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => shift(-1)} className="size-9 grid place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></button>
            <div className="text-center">
              <p className="font-display text-2xl text-foreground">
                {isToday(selected) ? "Today" : prettyDate(fromDayKey(selected))}
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                {doneCount}/{dayTasks.length} done
              </p>
            </div>
            <button onClick={() => shift(1)} className="size-9 grid place-items-center rounded-full bg-secondary"><ChevronRight className="size-5" /></button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Add a task…"
              className="min-w-40 flex-1 rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-1">
              {(Object.keys(PRIORITIES) as Task["priority"][]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${priority === p ? "text-white" : "bg-secondary/50 text-secondary-foreground"}`}
                  style={{ background: priority === p ? PRIORITIES[p].color : undefined }}
                >
                  {PRIORITIES[p].label}
                </button>
              ))}
            </div>
            <button onClick={add} className="grid size-10 place-items-center rounded-2xl bg-gradient-pink text-primary-foreground shadow-soft"><Plus className="size-5" /></button>
          </div>

          {dayTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tasks — enjoy the calm 🌸</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dayTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-blush/40 px-3 py-2.5">
                  <button
                    onClick={() => toggle(t.id)}
                    className={`grid size-6 place-items-center rounded-lg border-2 transition ${t.done ? "border-transparent" : "border-secondary"}`}
                    style={{ background: t.done ? PRIORITIES[t.priority].color : "transparent" }}
                  >
                    {t.done && <Check className="size-4 text-white" />}
                  </button>
                  <span className="size-2 rounded-full" style={{ background: PRIORITIES[t.priority].color }} />
                  <span className={`flex-1 text-sm font-medium ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {t.title}
                  </span>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopCard>

        <SoftCard>
          <p className="mb-3 text-sm font-bold text-secondary-foreground">Upcoming</p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled ahead.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-blush/40 px-3 py-2">
                  <span className="size-2 rounded-full" style={{ background: PRIORITIES[t.priority].color }} />
                  <span className="flex-1 text-sm font-medium text-foreground">{t.title}</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{prettyDate(fromDayKey(t.date))}</span>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </div>
    </div>
  );
}
