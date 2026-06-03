import { Sparkles } from "lucide-react";
import pinDesk from "@/assets/pin-desk.jpg";
import pinMoney from "@/assets/pin-money.jpg";
import pinRoses from "@/assets/pin-roses.jpg";
import pinMorning from "@/assets/pin-morning.jpg";
import pinPilates from "@/assets/pin-pilates.jpg";
import featBlog from "@/assets/feat-blog.jpg";

const products = [
  { name: "Bloom Premium",   price: "$4.99/mo", desc: "Unlock every tool, AI insights & themes.", accent: "#ec6f9e", img: pinDesk,    featured: true },
  { name: "Cycle Pro",       price: "$2.99/mo", desc: "Advanced predictions & symptom analytics.", accent: "#a87ad8", img: pinRoses  },
  { name: "Printable Pack",  price: "$7",       desc: "Cute planner & journal printables (PDF).",  accent: "#efb24d", img: featBlog  },
  { name: "Budget Bundle",   price: "$5",       desc: "Savings challenges & money templates.",      accent: "#5cb874", img: pinMoney  },
  { name: "Wellness Pack",   price: "$6",       desc: "Morning routines & self-care rituals guide.",accent: "#e88ac0", img: pinMorning},
  { name: "Move & Glow",     price: "$4",       desc: "Pilates & stretching guide for soft girls.", accent: "#5cc0cc", img: pinPilates},
];

export default function ShopPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 font-script text-4xl sm:text-5xl text-gradient-pink">
          Shop <span className="text-3xl">🛍️</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Little treats to make your Bloom even prettier.
        </p>
      </header>

      {/* Featured banner */}
      <div className="group relative mb-6 cursor-pointer overflow-hidden rounded-3xl shadow-soft">
        <img
          src={pinDesk}
          alt="Bloom Premium"
          className="h-52 w-full object-cover object-center transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
          <div>
            <span className="flex items-center gap-1 rounded-full bg-gradient-pink px-3 py-1 text-[10px] font-bold uppercase text-white shadow-soft w-fit">
              <Sparkles className="size-3" /> Best value
            </span>
            <h2 className="mt-2 font-display text-2xl text-white drop-shadow">Bloom Premium</h2>
            <p className="text-sm text-white/80">Unlock every tool, AI insights & themes.</p>
          </div>
          <button className="rounded-full bg-gradient-pink px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:scale-105">
            $4.99/mo
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(1).map((p) => (
          <div
            key={p.name}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-pink"
          >
            <div className="h-32 overflow-hidden">
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-xl text-foreground">{p.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-foreground">{p.price}</span>
                <button
                  className="rounded-full px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:scale-105"
                  style={{ background: p.accent }}
                >
                  Get it
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
