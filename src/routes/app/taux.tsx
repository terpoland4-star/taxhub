import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/card";
import { formatPercent, formatXof, num } from "@/lib/fiscal/format";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/taux")({ component: RatesPage });

function RatesPage() {
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  const rates = ws.data?.rates ?? [];

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Barème versionné</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Taux et seuils</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Aucune valeur fiscale n’est codée dans les écrans. Le moteur lit cette table. Toutes les
          lignes sont <span className="font-medium text-fg">non validées</span> jusqu’à la Phase Z.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Libellé</th>
              <th className="px-4 py-2 font-medium">Valeur</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">En vigueur</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => {
              const v = num(r.value_numeric);
              return (
                <tr key={r.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-subtle">{r.code}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.unit === "percent" ? formatPercent(v) : formatXof(v)}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-xs leading-relaxed text-muted">{r.source}</td>
                  <td className="px-4 py-3 text-xs">{r.effective_from}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.validated ? "ok" : "warn"}>
                      {r.validated ? "Validé" : "À valider"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
