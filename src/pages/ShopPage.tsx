import { Sparkles } from "lucide-react";
import heroGirl from "@/assets/hero-girl.jpg";
import featCycle from "@/assets/feat-cycle.jpg";
import featDiary from "@/assets/feat-diary.jpg";
import featBudget from "@/assets/feat-budget.jpg";
import featSteps from "@/assets/feat-steps.jpg";
import featBlog from "@/assets/feat-blog.jpg";

const products = [
  { name: "Bloom Premium", price: "$4.99/mo", desc: "Unlock every tool, AI insights & themes.", accent: "#ec6f9e", img: heroGirl, featured: true },
  { name: "Cycle Pro", price: "$2.99/mo", desc: "Advanced predictions & symptom analytics.", accent: "#a87ad8", img: featCycle },
  { name: "Printable Pack", price: "$7", desc: "Cute planner & journal printables (PDF).", accent: "#efb24d", img: featDiary },
  { name: "Budget Bundle", price: "$5", desc: "Savings challenges & money templates.", accent: "#5cb874", img: featBudget },
  { name: "Wallpaper Set", price: "$3", desc: "20 dreamy pink phone wallpapers.", accent: "#e88ac0", img: featSteps },
  { name: "Sticker Pack", price: "$2", desc: "Decorate your diary with 50 stickers.", accent: "#5cc0cc", img: featBlog },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.name}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-pink ${
              p.featured ? "border-primary/40" : "border-border"
            }`}
          >
            <div className="h-32 overflow-hidden">
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
            </div>
            {p.featured && (
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gradient-pink px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow-soft">
                <Sparkles className="size-3" /> Best
              </span>
            )}
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
