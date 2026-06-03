import { Clock } from "lucide-react";
import featBlog from "@/assets/feat-blog.jpg";
import featCycle from "@/assets/feat-cycle.jpg";
import featDiary from "@/assets/feat-diary.jpg";
import pinMorning from "@/assets/pin-morning.jpg";
import pinPilates from "@/assets/pin-pilates.jpg";
import pinMoney from "@/assets/pin-money.jpg";
import pinRoses from "@/assets/pin-roses.jpg";

const articles = [
  { tag: "Wellness",  title: "5 soft morning rituals to start your day glowing",      mins: 4, accent: "#ec7aa0", img: pinMorning },
  { tag: "Cycle",     title: "Understanding your cycle phases (and your moods)",       mins: 6, accent: "#a87ad8", img: featCycle  },
  { tag: "Money",     title: "The cute girl's guide to a no-stress budget",            mins: 5, accent: "#5cb874", img: pinMoney   },
  { tag: "Mind",      title: "Journaling prompts for a calmer, kinder mind",          mins: 3, accent: "#efb24d", img: featDiary  },
  { tag: "Body",      title: "Gentle movement: pilates flows for slow days",          mins: 7, accent: "#5cc0cc", img: pinPilates },
  { tag: "Glow",      title: "Building a skincare routine you'll actually keep",       mins: 5, accent: "#e88ac0", img: pinRoses   },
  { tag: "Rituals",   title: "Your dream morning routine, step by step",              mins: 4, accent: "#ec6f9e", img: featBlog   },
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

      {/* Featured hero article */}
      <div className="group relative mb-6 cursor-pointer overflow-hidden rounded-3xl shadow-soft">
        <img
          src={pinMorning}
          alt="Morning rituals"
          className="h-56 w-full object-cover object-top transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <span className="rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Featured
          </span>
          <h2 className="mt-2 font-display text-2xl leading-snug text-white drop-shadow">
            5 soft morning rituals to start your day glowing
          </h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
            <Clock className="size-3.5" /> 4 min read
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(1).map((a) => (
          <article
            key={a.title}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-pink"
          >
            <div className="h-40 overflow-hidden">
              <img
                src={a.img}
                alt={a.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
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
