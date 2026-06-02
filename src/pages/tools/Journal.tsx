import { useState } from "react";
import { Trash2, PenLine } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, MOODS, type JournalEntry } from "@/data/schemas";
import { dayKey, fromDayKey, prettyDate } from "@/lib/date";
import { uid } from "@/lib/id";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

export default function Journal() {
  const tool = toolBySlug("journal")!;
  const [entries, setEntries] = useBloomState<JournalEntry[]>(KEYS.journal, []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState(4);

  const save = () => {
    if (!body.trim() && !title.trim()) return;
    setEntries((prev) => [
      { id: uid(), date: dayKey(), title: title.trim() || "Untitled", body: body.trim(), mood },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setMood(4);
  };

  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <PopCard>
          <p className="mb-3 flex items-center gap-2 font-script text-2xl text-hot">
            <PenLine className="size-5" /> new entry
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title your day…"
            className="mb-3 w-full rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Dear diary… 💖"
            rows={7}
            className="w-full resize-none rounded-2xl border-2 border-secondary bg-blush/40 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`text-2xl transition ${mood === m.value ? "scale-125" : "opacity-50"}`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <button onClick={save} className="rounded-2xl bg-gradient-pink px-6 py-2.5 font-bold text-primary-foreground shadow-soft hover:scale-105 transition">
              Save 💌
            </button>
          </div>
        </PopCard>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-secondary-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
          {entries.length === 0 ? (
            <SoftCard className="text-center text-muted-foreground">
              Your journal is empty — write your first entry ✨
            </SoftCard>
          ) : (
            entries.map((e) => {
              const m = MOODS.find((x) => x.value === e.mood);
              return (
                <SoftCard key={e.id} className="!p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">
                        {m?.emoji} {e.title}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {prettyDate(fromDayKey(e.date))}
                      </p>
                    </div>
                    <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {e.body && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{e.body}</p>}
                </SoftCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
