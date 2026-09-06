import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TaxResult } from "@/components/tax-result";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { computeDeclaration } from "@/lib/fiscal/engine";
import { DEFAULT_RATES, type Regime, type TaxType } from "@/lib/fiscal/types";
import { saveDeclaration } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/declaration")({ component: NewDeclaration });

function NewDeclaration() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  const navigate = useNavigate();
  const [taxType, setTaxType] = useState<TaxType>("synthetique");
  const [periodLabel, setPeriodLabel] = useState("T3 2026");
  const [periodStart, setPeriodStart] = useState("2026-07-01");
  const [periodEnd, setPeriodEnd] = useState("2026-09-30");
  const [dueDate, setDueDate] = useState("2026-10-15");
  const [ca, setCa] = useState("6200000");
  const [purchases, setPurchases] = useState("1800000");
  const [expenses, setExpenses] = useState("3500000");
  const [busy, setBusy] = useState(false);

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  const company = ws.data?.activeCompany;
  const rates = ws.data?.rateTable ?? DEFAULT_RATES;

  const preview = useMemo(() => {
    if (!company) return null;
    const n = Number(ca) || 0;
    return computeDeclaration(
      {
        taxType,
        regime: company.regime as Regime,
        activity: company.activity as "commerce",
        legalForm: company.legal_form as "ei",
        yearCreated: company.year_created,
        caHt: n,
        caTtc: n,
        purchasesHt: Number(purchases) || 0,
        expenses: Number(expenses) || 0,
        dueDate,
        asOfDate: "2026-09-06",
      },
      rates,
    );
  }, [company, taxType, ca, purchases, expenses, dueDate, rates]);

  async function persist(submit: boolean) {
    if (!company) return;
    setBusy(true);
    try {
      const n = Number(ca) || 0;
      const res = await saveDeclaration({
        data: {
          companyId: company.id,
          taxType,
          periodLabel: periodLabel.trim() || "Période",
          periodStart,
          periodEnd,
          dueDate,
          caHt: n,
          caTtc: n,
          purchasesHt: Number(purchases) || 0,
          expenses: Number(expenses) || 0,
          submit,
        },
      });
      await refresh();
      toast.success(submit ? "Déclaration enregistrée" : "Brouillon calculé");
      await navigate({ to: "/app/declaration/$id", params: { id: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Déclaration</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Nouvelle liquidation</h1>
        <p className="mt-1 text-sm text-muted">
          {company ? `${company.name} · régime ${company.regime.replace("_", " ")}` : "Choisissez une entreprise."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            void persist(true);
          }}
        >
          <Field label="Type d’impôt">
            <Select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)}>
              <option value="synthetique">Impôt synthétique</option>
              <option value="tva">TVA</option>
              <option value="isb">ISB</option>
            </Select>
          </Field>
          <Field label="Libellé de période">
            <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Début">
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </Field>
            <Field label="Fin">
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </Field>
            <Field label="Échéance">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Chiffre d’affaires (F CFA)">
            <Input inputMode="numeric" value={ca} onChange={(e) => setCa(e.target.value)} required />
          </Field>
          {taxType === "tva" ? (
            <Field label="Achats HT (TVA déductible)">
              <Input inputMode="numeric" value={purchases} onChange={(e) => setPurchases(e.target.value)} />
            </Field>
          ) : null}
          {taxType === "isb" ? (
            <Field label="Charges déductibles">
              <Input inputMode="numeric" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
            </Field>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={busy || !company}>
              Enregistrer
            </Button>
            <Button type="button" variant="secondary" disabled={busy || !company} onClick={() => void persist(false)}>
              Calculer seulement
            </Button>
          </div>
        </form>
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          {preview ? <TaxResult result={preview} /> : <p className="text-sm text-muted">Aperçu indisponible.</p>}
        </div>
      </div>
    </div>
  );
}
