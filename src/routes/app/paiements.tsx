import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/card";
import { formatXof, PROVIDER_LABELS, STATUS_LABELS } from "@/lib/fiscal/format";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/paiements")({ component: PaymentsPage });

function PaymentsPage() {
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  if (ws.isPending) return <div className="h-40 animate-pulse rounded-xl bg-surface-2" />;
  const payments = ws.data?.payments ?? [];
  const receipts = ws.data?.receipts ?? [];

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Trésorerie</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Paiements & reçus</h1>
      </header>
      <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        {payments.length === 0 ? (
          <p className="p-6 text-sm text-muted">Aucun paiement. Initiez-en un depuis une déclaration.</p>
        ) : (
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Référence</th>
                <th className="px-3 py-2 font-medium">Canal</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-5 py-2 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{p.reference}</td>
                  <td className="px-3 py-3 text-muted">{PROVIDER_LABELS[p.provider]}</td>
                  <td className="px-3 py-3">
                    <Badge tone={p.status === "confirmed" ? "ok" : p.status === "failed" ? "danger" : "warn"}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatXof(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {receipts.length ? (
        <div>
          <h2 className="mb-3 text-sm font-medium">Reçus</h2>
          <ul className="flex flex-col gap-2">
            {receipts.map((r) => (
              <li key={r.id}>
                <Link
                  to="/app/recu/$id"
                  params={{ id: r.id }}
                  className="flex min-h-11 items-center justify-between rounded-lg bg-surface px-4 shadow-[var(--shadow-border)]"
                >
                  <span className="text-sm font-medium">{r.reference}</span>
                  <span className="text-sm tabular-nums text-muted">{formatXof(r.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
