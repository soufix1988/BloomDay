import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Flower2, Sun, LayoutGrid, BookOpen, ShoppingBag, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app", end: true, label: "Today", icon: Sun },
  { to: "/app/tools", end: false, label: "Tools", icon: LayoutGrid },
  { to: "/app/read", end: false, label: "Read", icon: BookOpen },
  { to: "/app/shop", end: false, label: "Shop", icon: ShoppingBag },
  { to: "/app/me", end: false, label: "Me", icon: User },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map(({ to, end, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition",
              isActive
                ? "bg-gradient-pink text-primary-foreground shadow-soft"
                : "text-secondary-foreground hover:bg-blush",
            )
          }
        >
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-2 px-2 py-1">
      <div className="size-9 rounded-2xl bg-gradient-pink grid place-items-center shadow-soft">
        <Flower2 className="size-5 text-primary-foreground" />
      </div>
      <span className="font-script text-3xl text-gradient-pink leading-none">Bloom</span>
    </Link>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col gap-6 border-r border-border bg-card/70 backdrop-blur p-5 z-30">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <p className="px-2 font-script text-lg text-muted-foreground">stay soft, bloom on 🌸</p>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur px-4 py-3">
        <Brand />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="size-10 grid place-items-center rounded-2xl bg-blush text-secondary-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-card p-5 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="size-9 grid place-items-center rounded-xl bg-blush">
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <p className="px-2 font-script text-lg text-muted-foreground">stay soft, bloom on 🌸</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-border bg-card/90 backdrop-blur px-2 py-2">
        {NAV.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-semibold transition",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="lg:hidden h-16" />
    </div>
  );
}
