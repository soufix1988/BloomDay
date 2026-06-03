import { Bell, Palette, Heart, LogOut, ChevronRight, Sparkles } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, currentStreak, type Habit, type JournalEntry, type MoodEntry } from "@/data/schemas";

export default function MePage() {
  const email =
    (typeof window !== "undefined" && sessionStorage.getItem("bloom:subscriber")) || "bloom@girl.com";

  const [habits] = useBloomState<Habit[]>(KEYS.habits, []);
  const [journal] = useBloomState<JournalEntry[]>(KEYS.journal, []);
  const [moods] = useBloomState<Record<string, MoodEntry>>(KEYS.moodEntries, {});

  const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h.history)), 0);
  const stats = [
    { label: "Day streak", value: bestStreak, emoji: "🔥" },
    { label: "Journal entries", value: journal.length, emoji: "📔" },
    { label: "Mood check-ins", value: Object.keys(moods).length, emoji: "😊" },
  ];

  const settings = [
    { icon: Palette, label: "Theme & colors", hint: "Soft Rose", accent: "#ec6f9e" },
    { icon: Bell, label: "Reminders", hint: "On", accent: "#efb24d" },
    { icon: Heart, label: "Favorite tools", hint: "4 pinned", accent: "#a87ad8" },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 font-script text-4xl sm:text-5xl text-gradient-pink">
          Me <span className="text-3xl">🌷</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your soft little corner of Bloom.</p>
      </header>

      {/* Profile card */}
      <div className="mb-6 flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="grid size-16 place-items-center rounded-full bg-gradient-pink text-3xl shadow-soft">
          🌸
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl text-foreground">Hello, lovely</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <button className="ml-auto flex items-center gap-1 rounded-full bg-gradient-pink px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft">
          <Sparkles className="size-3.5" /> Premium
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-border bg-card p-4 text-center shadow-soft">
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Settings list */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {settings.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-blush ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${s.accent}1f`, color: s.accent }}>
                <Icon className="size-4" />
              </span>
              <span className="font-semibold text-foreground">{s.label}</span>
              <span className="ml-auto text-sm text-muted-foreground">{s.hint}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl border border-border bg-card py-3 text-sm font-semibold text-muted-foreground shadow-soft transition hover:text-foreground">
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
