import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Flower2, LayoutDashboard, Menu, X, Sparkles } from "lucide-react";
import { tools } from "@/data/tools";
import { cn } from "@/lib/utils";

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const base =
    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition group";
  return (
    <nav className="flex flex-col gap-1">
      <NavLink
        to="/app"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            base,
            isActive
              ? "bg-gradient-pink text-primary-foreground shadow-soft"
              : "text-secondary-foreground hover:bg-blush",
          )
        }
      >
        <LayoutDashboard className="size-5" />
        Dashboard
      </NavLink>

      <p className="px-3 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        My Tools
      </p>

      {tools.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.slug}
            to={`/app/tools/${t.slug}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                base,
                isActive
                  ? "bg-blush text-primary"
                  : "text-secondary-foreground hover:bg-blush",
              )
            }
          >
            <span
              className="grid size-7 place-items-center rounded-xl text-white shadow-soft"
              style={{ background: t.accent }}
            >
              <Icon className="size-4" />
            </span>
            {t.name}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2 px-2">
      <div className="size-9 rounded-full bg-gradient-pink grid place-items-center shadow-soft">
        <Flower2 className="size-5 text-primary-foreground" />
      </div>
      <span className="font-display text-2xl text-gradient-pink leading-none">
        Bloom
      </span>
    </Link>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dots">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col gap-4 border-r-4 border-foreground bg-card p-4 z-30">
        <Brand />
        <div className="flex-1 overflow-y-auto pr-1">
          <NavItems />
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-2xl bg-gradient-pink px-3 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Sparkles className="size-4" /> Bloom Premium
        </Link>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b-4 border-foreground bg-card px-4 py-3">
        <Brand />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="size-10 grid place-items-center rounded-2xl bg-secondary text-secondary-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-card p-4 flex flex-col gap-4 border-r-4 border-foreground overflow-y-auto">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="size-9 grid place-items-center rounded-xl bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
