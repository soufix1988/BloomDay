import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { Tool } from "@/data/tools";

export default function ToolHeader({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <div className="mb-6">
      <Link
        to="/app/tools"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ChevronLeft className="size-4" /> All tools
      </Link>
      <header className="flex items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl"
          style={{ background: `${tool.accent}1f`, color: tool.accent }}
        >
          <Icon className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">
            {tool.name} {tool.emoji}
          </h1>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </header>
    </div>
  );
}
