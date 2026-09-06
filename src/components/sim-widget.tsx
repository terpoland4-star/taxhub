import { useMemo, useState } from "react";
import { computeDeclaration } from "@/lib/fiscal/engine";
import { DEFAULT_RATES, type Activity, type TaxType } from "@/lib/fiscal/types";
import { formatXof } from "@/lib/fiscal/format";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TaxResult } from "@/components/tax-result";

export function SimWidget({ rates = DEFAULT_RATES }: { rates?: typeof DEFAULT_RATES }) {
  const [taxType, setTaxType] = useState<TaxType>("synthetique");
  const [activity, setActivity] = useState<Activity>("commerce");
  const [ca, setCa] = useState("8500000");
  const [purchases, setPurchases] = useState("2100000");
  const [expenses, setExpenses] = useState("5200000");

  const result = useMemo(() => {
    const n = Number(ca) || 0;
    return computeDeclaration(
      {
        taxType,
        regime: taxType === "synthetique" ? "synthetique" : "reel_normal",
        activity,
        legalForm: taxType === "synthetique" ? "ei" : "sarl",
        yearCreated: 2021,
        caHt: n,
        caTtc: n,
        purchasesHt: Number(purchases) || 0,
        expenses: Number(expenses) || 0,
        dueDate: "2026-10-15",
        asOfDate: "2026-09-06",
      },
      rates,
    );
  }, [taxType, activity, ca, purchases, expenses, rates]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
        <Field label="Impôt">
          <Select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)}>
            <option value="synthetique">Impôt synthétique</option>
            <option value="tva">TVA</option>
            <option value="isb">ISB</option>
          </Select>
        </Field>
        <Field label="Activité">
          <Select value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
            <option value="commerce">Commerce</option>
            <option value="services">Services</option>
            <option value="mixte">Mixte</option>
            <option value="industrie">Industrie</option>
          </Select>
        </Field>
        <Field label="Chiffre d’affaires (F CFA)">
          <Input inputMode="numeric" value={ca} onChange={(e) => setCa(e.target.value)} />
        </Field>
        {taxType === "tva" ? (
          <Field label="Achats HT">
            <Input inputMode="numeric" value={purchases} onChange={(e) => setPurchases(e.target.value)} />
          </Field>
        ) : null}
        {taxType === "isb" ? (
          <Field label="Charges déductibles">
            <Input inputMode="numeric" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
          </Field>
        ) : null}
        <p className="text-sm text-muted">
          Aperçu : <span className="font-medium text-fg">{formatXof(result.totalDue)}</span> à
          l’échéance du 15 octobre 2026.
        </p>
      </div>
      <TaxResult result={result} />
    </div>
  );
}
