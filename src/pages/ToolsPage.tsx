import { Link } from "react-router-dom";
import { categories, toolsByCategory, type Tool } from "@/data/tools";

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const isLive = tool.status === "live";

  const inner = (
    <>
      {tool.pro && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-pink px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
          Pro
        </span>
      )}
      {!isLive && (
        <span className="absolute right-3 top-3 rounded-full bg-blush px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
      <span
        className="grid size-12 place-items-center rounded-2xl"
        style={{ background: `${tool.accent}1f`, color: tool.accent }}
      >
        <Icon className="size-6" />
      </span>
      <p className="mt-3 font-semibold text-foreground">{tool.name}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{tool.description}</p>
    </>
  );

  const base =
    "relative flex flex-col items-center rounded-3xl bg-card p-5 text-center border border-border shadow-soft transition";

  return isLive ? (
    <Link to={`/app/tools/${tool.slug}`} className={`${base} hover:-translate-y-1 hover:shadow-pink`}>
      {inner}
    </Link>
  ) : (
    <div className={`${base} opacity-60`} aria-disabled>
      {inner}
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 font-script text-4xl sm:text-5xl text-gradient-pink">
          Tools <span className="text-3xl">🧸</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tiny rituals for a softer, more put-together life.
        </p>
      </header>

      <div className="flex flex-col gap-9">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-foreground">
              <span>{cat.emoji}</span> {cat.name}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {toolsByCategory(cat.id).map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
