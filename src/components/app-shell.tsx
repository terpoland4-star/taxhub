import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  Menu,
  PenLine,
  Receipt,
  Scale,
  Settings,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/lib/use-workspace";
import { Seal, Wordmark } from "./brand";
import { DisclaimerBanner } from "./disclaimer";

const NAV = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/app/declaration", label: "Déclaration", icon: PenLine },
  { to: "/app/simulation", label: "Simulation", icon: SlidersHorizontal },
  { to: "/app/paiements", label: "Paiements", icon: Wallet },
  { to: "/app/calendrier", label: "Calendrier", icon: CalendarDays },
  { to: "/app/export", label: "Export", icon: FileSpreadsheet },
  { to: "/app/entreprise", label: "Entreprise", icon: Building2 },
  { to: "/app/cabinet", label: "Cabinet", icon: Users },
  { to: "/app/taux", label: "Taux fiscaux", icon: Landmark },
  { to: "/app/validation", label: "Phase Z", icon: Scale },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppShell() {
  const { user, isPending } = useCurrentUserState();
  const ws = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const cabinet = ws.data?.cabinets[0];
  const accent = cabinet?.accent_color;

  return (
    <div
      className="min-h-screen bg-bg text-fg"
      style={accent ? ({ ["--color-accent"]: accent } as CSSProperties) : undefined}
    >
      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-screen flex-col border-r border-border bg-surface lg:flex">
          <div className="flex items-center gap-2 px-5 py-5">
            <Seal className="size-8" />
            <Wordmark />
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-6">
            {NAV.map((item) => {
              const active =
                item.to === "/app"
                  ? pathname === "/app"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-4 py-4">
            {isPending ? (
              <div className="h-8 w-32 animate-pulse rounded-full bg-surface-2" />
            ) : user ? (
              <UserButton />
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm lg:hidden">
            <Link to="/app" className="flex items-center gap-2">
              <Seal className="size-7" />
              <Wordmark />
            </Link>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-md hover:bg-surface-2"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </button>
          </header>

          {open ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-ink/40"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-[min(84vw,20rem)] flex-col bg-surface p-4 shadow-[var(--shadow-border-hover)]">
                <div className="mb-4 flex items-center justify-between">
                  <Wordmark />
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-md"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-fg hover:bg-surface-2"
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-5">
              <DisclaimerBanner compact />
            </div>
            <Outlet />
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          { to: "/app", label: "Accueil", icon: LayoutDashboard },
          { to: "/app/declaration", label: "Déclarer", icon: PenLine },
          { to: "/app/calendrier", label: "Échéances", icon: CalendarDays },
          { to: "/app/paiements", label: "Payer", icon: Receipt },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
