import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, MOODS, type MoodEntry } from "@/data/schemas";
import { dayKey, lastNDays, fromDayKey, prettyDate } from "@/lib/date";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

export default function MoodTracker() {
  const tool = toolBySlug("mood")!;
  const today = dayKey();
  const [entries, setEntries] = useBloomState<Record<string, MoodEntry>>(KEYS.moodEntries, {});
  const [note, setNote] = useState(entries[today]?.note ?? "");

  const todayMood = entries[today]?.mood;

  const pick = (mood: number) =>
    setEntries((prev) => ({ ...prev, [today]: { mood, note: prev[today]?.note ?? note } }));

  const saveNote = () =>
    setEntries((prev) => ({
      ...prev,
      [today]: { mood: prev[today]?.mood ?? 3, note },
    }));

  const chartData = lastNDays(14).map((k) => ({
    day: prettyDate(fromDayKey(k)).replace(/^\w+ /, ""),
    mood: entries[k]?.mood ?? null,
  }));

  const recent = lastNDays(7)
    .map((k) => ({ key: k, ...entries[k] }))
    .filter((e) => e.mood)
    .reverse();

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="grid gap-5 md:grid-cols-2">
        <PopCard>
          <p className="font-script text-2xl text-hot">how are you feeling?</p>
          <div className="mt-4 flex justify-between">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => pick(m.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
                  todayMood === m.value ? "scale-110 bg-blush" : "opacity-70 hover:opacity-100"
                }`}
              >
                <span className="text-4xl">{m.emoji}</span>
                <span className="text-[10px] font-bold text-secondary-foreground">{m.label}</span>
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="What's on your mind today? 💭"
            className="mt-4 w-full resize-none rounded-2xl border-2 border-secondary bg-blush/40 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </PopCard>

        <SoftCard>
          <p className="mb-2 text-sm font-bold text-secondary-foreground">14-day mood trend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone" dataKey="mood" stroke={tool.accent}
                  strokeWidth={3} dot={{ r: 3 }} connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SoftCard>
      </div>

      <SoftCard className="mt-5">
        <p className="mb-3 text-sm font-bold text-secondary-foreground">Recent check-ins</p>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet — pick a mood above 💖</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((e) => {
              const m = MOODS.find((x) => x.value === e.mood)!;
              return (
                <li key={e.key} className="flex items-center gap-3 rounded-2xl bg-blush/40 px-3 py-2">
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-secondary-foreground">
                      {prettyDate(fromDayKey(e.key))} · {m.label}
                    </p>
                    {e.note && <p className="text-sm text-foreground/80">{e.note}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SoftCard>
    </div>
  );
}
