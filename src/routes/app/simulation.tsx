import { createFileRoute } from "@tanstack/react-router";
import { SimWidget } from "@/components/sim-widget";
import { DEFAULT_RATES } from "@/lib/fiscal/types";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/simulation")({ component: SimulationPage });

function SimulationPage() {
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Sandbox</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Simulation</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Rien n’est enregistré. Utile pour un devis cabinet ou un arbitrage de régime.
        </p>
      </header>
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-8">
        <SimWidget rates={ws.data?.rateTable ?? DEFAULT_RATES} />
      </div>
    </div>
  );
}
