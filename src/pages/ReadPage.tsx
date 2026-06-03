import { Clock } from "lucide-react";

const articles = [
  { tag: "Wellness", title: "5 soft morning rituals to start your day glowing", mins: 4, accent: "#ec7aa0", emoji: "🌅" },
  { tag: "Cycle", title: "Understanding your cycle phases (and your moods)", mins: 6, accent: "#a87ad8", emoji: "🌸" },
  { tag: "Money", title: "The cute girl's guide to a no-stress budget", mins: 5, accent: "#5cb874", emoji: "💰" },
  { tag: "Mind", title: "Journaling prompts for a calmer, kinder mind", mins: 3, accent: "#efb24d", emoji: "📔" },
  { tag: "Body", title: "Gentle movement: yoga flows for slow days", mins: 7, accent: "#5cc0cc", emoji: "🧘" },
  { tag: "Glow", title: "Building a skincare routine you'll actually keep", mins: 5, accent: "#e88ac0", emoji: "✨" },
];

export default function ReadPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 font-script text-4xl sm:text-5xl text-gradient-pink">
          Read <span className="text-3xl">📖</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Soft stories, tips & rituals for the modern girl.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <article
            key={a.title}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-pink"
          >
            <div
              className="grid h-32 place-items-center text-5xl"
              style={{ background: `${a.accent}1f` }}
            >
              {a.emoji}
            </div>
            <div className="p-5">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: `${a.accent}22`, color: a.accent }}
              >
                {a.tag}
              </span>
              <h3 className="mt-2 font-display text-lg leading-snug text-foreground">{a.title}</h3>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {a.mins} min read
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
