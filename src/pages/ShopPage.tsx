import { Sparkles } from "lucide-react";

const products = [
  { name: "Bloom Premium", price: "$4.99/mo", desc: "Unlock every tool, AI insights & themes.", accent: "#ec6f9e", emoji: "👑", featured: true },
  { name: "Cycle Pro", price: "$2.99/mo", desc: "Advanced predictions & symptom analytics.", accent: "#a87ad8", emoji: "🌸" },
  { name: "Printable Pack", price: "$7", desc: "Cute planner & journal printables (PDF).", accent: "#efb24d", emoji: "🖨️" },
  { name: "Budget Bundle", price: "$5", desc: "Savings challenges & money templates.", accent: "#5cb874", emoji: "💰" },
  { name: "Wallpaper Set", price: "$3", desc: "20 dreamy pink phone wallpapers.", accent: "#e88ac0", emoji: "📱" },
  { name: "Sticker Pack", price: "$2", desc: "Decorate your diary with 50 stickers.", accent: "#5cc0cc", emoji: "🌷" },
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
            className={`relative flex flex-col rounded-3xl border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-pink ${
              p.featured ? "border-primary/40" : "border-border"
            }`}
          >
            {p.featured && (
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gradient-pink px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow-soft">
                <Sparkles className="size-3" /> Best
              </span>
            )}
            <span className="grid size-14 place-items-center rounded-2xl text-3xl" style={{ background: `${p.accent}1f` }}>
              {p.emoji}
            </span>
            <h3 className="mt-3 font-display text-xl text-foreground">{p.name}</h3>
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
        ))}
      </div>
    </div>
  );
}
