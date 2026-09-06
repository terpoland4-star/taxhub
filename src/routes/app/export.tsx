import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatXof, STATUS_LABELS, TAX_LABELS } from "@/lib/fiscal/format";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/export")({ component: ExportPage });

function csvEscape(v: string | number) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ExportPage() {
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  const declarations = ws.data?.declarations ?? [];
  const payments = ws.data?.payments ?? [];

  function download(kind: "declarations" | "paiements") {
    const rows =
      kind === "declarations"
        ? [
            ["id", "periode", "impot", "statut", "ca", "du", "penalites", "total", "echeance"].join(","),
            ...declarations.map((d) =>
              [
                d.id,
                d.period_label,
                TAX_LABELS[d.tax_type],
                STATUS_LABELS[d.status],
                d.ca_ht,
                d.tax_due,
                d.penalty,
                d.total_due,
                d.due_date,
              ]
                .map(csvEscape)
                .join(","),
            ),
          ]
        : [
            ["id", "reference", "canal", "statut", "montant", "date"].join(","),
            ...payments.map((p) =>
              [p.id, p.reference, p.provider, p.status, p.amount, p.created_at].map(csvEscape).join(","),
            ),
          ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nigertax-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Comptabilité</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Export</h1>
        <p className="mt-1 text-sm text-muted">CSV prêt pour Excel ou un logiciel SYSCOHADA.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-medium">Déclarations</h2>
          <p className="mt-1 text-sm text-muted">{declarations.length} ligne(s)</p>
          <Button className="mt-4" variant="secondary" onClick={() => download("declarations")}>
            Télécharger CSV
          </Button>
        </div>
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-medium">Paiements</h2>
          <p className="mt-1 text-sm text-muted">{payments.length} ligne(s)</p>
          <Button className="mt-4" variant="secondary" onClick={() => download("paiements")}>
            Télécharger CSV
          </Button>
        </div>
      </div>
      {declarations.length ? (
        <p className="text-sm text-muted">
          Dernier total dû :{" "}
          <span className="font-medium text-fg">
            {formatXof(declarations.reduce((s, d) => s + d.total_due, 0))}
          </span>
        </p>
      ) : null}
    </div>
  );
}
