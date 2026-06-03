import { Link } from "react-router-dom";
import { GlassWater, Flame, CheckCircle2, Sparkles, ArrowRight, CalendarDays } from "lucide-react";
import { photos } from "@/data/photos";
import { useBloomState } from "@/hooks/useBloomState";
import {
  KEYS, MOODS, currentStreak, predictCycle,
  type MoodEntry, type Habit, type Transaction, type Task, type Goal, type PeriodSettings,
} from "@/data/schemas";
import { dayKey, fromDayKey, prettyDate } from "@/lib/date";
import { liveTools } from "@/data/tools";
import { quoteOfTheDay } from "@/data/quotes";
import { PopCard, SoftCard } from "@/components/common/Card";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const today = dayKey();
  const [moods, setMoods] = useBloomState<Record<string, MoodEntry>>(KEYS.moodEntries, {});
  const [waterLog, setWaterLog] = useBloomState<Record<string, number>>(KEYS.waterLog, {});
  const [waterGoal] = useBloomState<number>(KEYS.waterGoal, 8);
  const [habits] = useBloomState<Habit[]>(KEYS.habits, []);
  const [txns] = useBloomState<Transaction[]>(KEYS.budget, []);
  const [tasks, setTasks] = useBloomState<Task[]>(KEYS.tasks, []);
  const [goals] = useBloomState<Goal[]>(KEYS.goals, []);
  const [starts] = useBloomState<string[]>(KEYS.periodStarts, []);
  const [pSettings] = useBloomState<PeriodSettings>(KEYS.periodSettings, { cycleLength: 28, periodLength: 5 });

  const water = waterLog[today] ?? 0;
  const waterPct = Math.min(100, Math.round((water / waterGoal) * 100));
  const todayMood = moods[today]?.mood;
  const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h.history)), 0);
  const balance = txns.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const cycle = predictCycle(starts, pSettings);
  const todayTasks = tasks.filter((t) => t.date === today);
  const tasksDone = todayTasks.filter((t) => t.done).length;
  const topGoal = goals.find((g) => g.current < g.target) ?? goals[0];
  const upcoming = tasks
    .filter((t) => !t.done && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div>
      {/* Hero banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl shadow-soft">
        <img
          src={photos.morning}
          alt="Your Bloom today"
          className="h-44 w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6">
          <p className="font-script text-2xl text-white/90">{greeting()}, gorgeous</p>
          <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight drop-shadow">
            Your Bloom today 🌸
          </h1>
        </div>
      </div>

      {/* Quote */}
      <PopCard className="mb-5 bg-gradient-pink !text-primary-foreground">
        <div className="flex items-center gap-3">
          <Sparkles className="size-6 shrink-0" />
          <p className="font-script text-2xl sm:text-3xl">{quoteOfTheDay()}</p>
        </div>
      </PopCard>

      {/* Widgets grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Mood */}
        <SoftCard>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Today's mood</p>
          <div className="mt-2 flex justify-between">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMoods((prev) => ({ ...prev, [today]: { mood: m.value, note: prev[today]?.note } }))}
                className={`text-2xl transition ${todayMood === m.value ? "scale-125" : "opacity-50 hover:opacity-90"}`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </SoftCard>

        {/* Water */}
        <SoftCard>
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Water</p>
            <button
              onClick={() => setWaterLog((prev) => ({ ...prev, [today]: (prev[today] ?? 0) + 1 }))}
              className="flex items-center gap-1 rounded-full bg-[#38bdf8] px-3 py-1 text-xs font-bold text-white"
            >
              <GlassWater className="size-3.5" /> +1
            </button>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{water}<span className="text-sm text-muted-foreground">/{waterGoal}</span></p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-blush">
            <div className="h-full rounded-full bg-[#38bdf8]" style={{ width: `${waterPct}%` }} />
          </div>
        </SoftCard>

        {/* Cycle */}
        <SoftCard>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Cycle</p>
          {cycle.hasData ? (
            <>
              <p className="mt-2 text-2xl font-black text-hot">Day {cycle.cycleDay}</p>
              <p className="text-xs font-bold text-secondary-foreground">{cycle.phase} · next in {cycle.daysUntilNext}d</p>
            </>
          ) : (
            <Link to="/app/tools/period" className="mt-2 block text-sm font-bold text-primary">Log your period →</Link>
          )}
        </SoftCard>

        {/* Habit streak */}
        <SoftCard>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Best streak</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-black text-[#ef4444]">
            <Flame className="size-6" /> {bestStreak} <span className="text-sm font-bold text-muted-foreground">days</span>
          </p>
        </SoftCard>

        {/* Savings/balance */}
        <SoftCard>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Balance</p>
          <p className="mt-2 text-2xl font-black text-[#22c55e]">${balance.toFixed(0)}</p>
          {topGoal && (
            <p className="text-xs font-bold text-secondary-foreground">
              🎯 {topGoal.title}: {Math.round((topGoal.current / topGoal.target) * 100)}%
            </p>
          )}
        </SoftCard>

        {/* Tasks */}
        <SoftCard>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Today's tasks</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-black text-foreground">
            <CheckCircle2 className="size-6 text-primary" /> {tasksDone}/{todayTasks.length}
          </p>
        </SoftCard>
      </div>

      {/* Today's tasks list + upcoming */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PopCard>
          <p className="mb-3 flex items-center gap-2 font-script text-2xl text-hot">
            <CheckCircle2 className="size-5" /> today's to-dos
          </p>
          {todayTasks.length === 0 ? (
            <Link to="/app/tools/planner" className="text-sm font-bold text-primary">Plan your day →</Link>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <button onClick={() => toggleTask(t.id)} className={`size-5 rounded-md border-2 ${t.done ? "border-primary bg-primary" : "border-secondary"}`} />
                  <span className={`text-sm ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </PopCard>

        <SoftCard>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-secondary-foreground">
            <CalendarDays className="size-4" /> Upcoming events
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on the horizon 🌷</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-2xl bg-blush/40 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{prettyDate(fromDayKey(t.date))}</span>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </div>

      {/* Tool shortcuts */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Your tools</h2>
        <Link to="/app/tools" className="flex items-center gap-1 text-sm font-semibold text-primary">
          See all <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {liveTools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.slug}
              to={`/app/tools/${t.slug}`}
              className="group flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-pink"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${t.accent}1f`, color: t.accent }}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{t.name}</p>
                <p className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="size-3" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
