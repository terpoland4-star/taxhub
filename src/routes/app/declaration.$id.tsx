import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TaxResult } from "@/components/tax-result";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDue } from "@/lib/fiscal/calendar";
import { formatXof, PROVIDER_LABELS, STATUS_LABELS, TAX_LABELS } from "@/lib/fiscal/format";
import type { ComputeResult } from "@/lib/fiscal/types";
import { confirmPayment, startPayment } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/declaration/$id")({ component: DeclarationDetail });

function DeclarationDetail() {
  const { id } = Route.useParams();
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  const [provider, setProvider] = useState<"airtel" | "moov" | "card">("airtel");
  const [phone, setPhone] = useState("90 00 00 00");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  if (ws.isPending) return <div className="h-40 animate-pulse rounded-xl bg-surface-2" />;

  const decl = ws.data?.declarations.find((d) => d.id === id);
  const company = ws.data?.companies.find((c) => c.id === decl?.company_id);
  const pays = ws.data?.payments.filter((p) => p.declaration_id === id) ?? [];
  const receipts = ws.data?.receipts.filter((r) => r.declaration_id === id) ?? [];

  if (!decl) {
    return (
      <p className="text-muted">
        Déclaration introuvable. <Link to="/app">Retour</Link>
      </p>
    );
  }

  let breakdown: ComputeResult | null = null;
  try {
    breakdown = JSON.parse(decl.breakdown) as ComputeResult;
  } catch {
    breakdown = null;
  }

  async function pay() {
    setBusy(true);
    try {
      const res = await startPayment({ data: { declarationId: id, provider, phone } });
      setPendingId(res.id);
      await refresh();
      toast.message("Paiement initié — confirmez le webhook sandbox");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Paiement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function webhook(outcome: "confirmed" | "failed" | "timeout") {
    const payId = pendingId ?? pays.find((p) => p.status === "pending")?.id;
    if (!payId) return;
    setBusy(true);
    try {
      const res = await confirmPayment({ data: { paymentId: payId, outcome } });
      await refresh();
      if (outcome === "confirmed" && res.receiptId) {
        toast.success(`Paiement confirmé · ${res.reference}`);
      } else toast.message("Retour de paiement enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Webhook impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {TAX_LABELS[decl.tax_type]} · {decl.period_label}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            {formatXof(decl.total_due)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {company?.name} · échéance {formatDue(decl.due_date)}
          </p>
        </div>
        <Badge
          tone={decl.status === "payee" ? "ok" : decl.status === "en_retard" ? "danger" : "accent"}
        >
          {STATUS_LABELS[decl.status]}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          {breakdown ? (
            <TaxResult result={breakdown} />
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Impôt</dt>
                <dd className="tabular-nums">{formatXof(decl.tax_due)}</dd>
              </div>
              <div>
                <dt className="text-muted">Pénalités</dt>
                <dd className="tabular-nums">{formatXof(decl.penalty)}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-medium">Paiement Mobile Money</h2>
          <p className="mt-1 text-sm text-muted">
            Environnement de test. Aucun flux réel vers Airtel, Moov ou une banque.
          </p>
          {decl.status === "payee" ? (
            <div className="mt-4">
              <p className="text-sm text-ok">Soldé.</p>
              {receipts.map((r) => (
                <Button key={r.id} asChild variant="secondary" className="mt-3">
                  <Link to="/app/recu/$id" params={{ id: r.id }}>
                    Voir le reçu {r.reference}
                  </Link>
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Canal">
                <Select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
                  <option value="airtel">Airtel Money</option>
                  <option value="moov">Moov Money</option>
                  <option value="card">Carte bancaire</option>
                </Select>
              </Field>
              <Field label="Téléphone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Button type="button" disabled={busy} onClick={() => void pay()}>
                Initier {formatXof(decl.total_due)}
              </Button>
              {(pendingId || pays.some((p) => p.status === "pending")) && (
                <div className="rounded-lg bg-surface-2 p-3 text-sm">
                  <p className="font-medium">Simulation USSD</p>
                  <p className="mt-1 text-muted">
                    Composez *144*1*{decl.total_due}# puis validez. Ensuite, simulez le webhook.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => void webhook("confirmed")}>
                      Confirmer
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void webhook("failed")}>
                      Échec
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void webhook("timeout")}>
                      Timeout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pays.length ? (
            <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
              {pays.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>
                    {PROVIDER_LABELS[p.provider]} · {p.reference}
                  </span>
                  <span className="text-muted">{STATUS_LABELS[p.status]}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
