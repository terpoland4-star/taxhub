import { createFileRoute, Link } from "@tanstack/react-router";
import { Seal, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { formatDue } from "@/lib/fiscal/calendar";
import { formatXof, TAX_LABELS } from "@/lib/fiscal/format";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/recu/$id")({ component: ReceiptPage });

function ReceiptPage() {
  const { id } = Route.useParams();
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  const rec = ws.data?.receipts.find((r) => r.id === id);
  const pay = ws.data?.payments.find((p) => p.id === rec?.payment_id);
  const decl = ws.data?.declarations.find((d) => d.id === rec?.declaration_id);

  if (ws.isPending) return <div className="h-64 animate-pulse rounded-xl bg-surface-2" />;
  if (!rec) return <p className="text-muted">Reçu introuvable.</p>;

  return (
    <div className="pb-16 lg:pb-0">
      <div className="mb-4 flex gap-2 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          Imprimer / PDF
        </Button>
        <Button asChild variant="ghost">
          <Link to="/app/paiements">Retour</Link>
        </Button>
      </div>
      <article className="mx-auto max-w-xl rounded-xl bg-surface p-8 shadow-[var(--shadow-border)] print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Seal className="size-10" />
            <Wordmark className="text-xl" />
          </div>
          <p className="text-right text-xs text-muted">
            Reçu de paiement
            <br />
            Indicateur — hors canal DGI
          </p>
        </header>
        <h1 className="mt-6 font-display text-3xl tabular-nums tracking-tight">{formatXof(rec.amount)}</h1>
        <p className="mt-1 text-sm text-muted">Référence {rec.reference}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Entreprise</dt>
            <dd className="font-medium">{rec.company_name}</dd>
          </div>
          <div>
            <dt className="text-muted">NIF</dt>
            <dd>{rec.nif || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Impôt</dt>
            <dd>{TAX_LABELS[rec.tax_type] ?? rec.tax_type}</dd>
          </div>
          <div>
            <dt className="text-muted">Période</dt>
            <dd>{decl?.period_label ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Échéance</dt>
            <dd>{decl ? formatDue(decl.due_date) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Horodatage</dt>
            <dd>{rec.issued_at?.slice(0, 19).replace("T", " ")}</dd>
          </div>
          <div>
            <dt className="text-muted">Canal</dt>
            <dd>{pay?.provider ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Téléphone</dt>
            <dd>{pay?.phone || "—"}</dd>
          </div>
        </dl>
        <p className="mt-8 text-xs leading-relaxed text-subtle">
          Ce document atteste d’un paiement simulé dans NigerTax Pro. Il ne vaut pas quittance
          fiscale officielle de la Direction Générale des Impôts du Niger tant que la Phase Z
          (validation juridique et partenariat institutionnel) n’est pas close.
        </p>
      </article>
    </div>
  );
}
