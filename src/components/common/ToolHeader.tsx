import type { Tool } from "@/data/tools";

export default function ToolHeader({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <header className="mb-6 flex items-center gap-4">
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-pink border-4 border-card"
        style={{ background: tool.accent }}
      >
        <Icon className="size-7" />
      </span>
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">
          {tool.name} {tool.emoji}
        </h1>
        <p className="text-sm text-secondary-foreground/80">{tool.description}</p>
      </div>
    </header>
  );
}
