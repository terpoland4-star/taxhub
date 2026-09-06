import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ACTIVITY_LABELS, LEGAL_FORM_LABELS, REGIME_LABELS } from "@/lib/fiscal/format";
import type { Activity, LegalForm, Regime } from "@/lib/fiscal/types";
import { recommendRegime } from "@/lib/fiscal/engine";
import { upsertCompany } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/entreprise")({ component: CompanyPage });

function CompanyPage() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  const c = ws.data?.activeCompany;
  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [legalForm, setLegalForm] = useState<LegalForm>("ei");
  const [activity, setActivity] = useState<Activity>("commerce");
  const [regime, setRegime] = useState<Regime>("synthetique");
  const [city, setCity] = useState("Niamey");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (!c) return;
    setName(c.name);
    setNif(c.nif);
    setLegalForm(c.legal_form as LegalForm);
    setActivity(c.activity as Activity);
    setRegime(c.regime as Regime);
    setCity(c.city);
    setPhone(c.phone);
    setEmail(c.email);
    setYear(String(c.year_created ?? new Date().getFullYear()));
  }, [c]);

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;

  const suggested = recommendRegime({ legalForm, caHt: 0, caTtc: 0, rates: ws.data?.rateTable });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Profil</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Entreprise</h1>
      </header>
      <form
        className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await upsertCompany({
              data: {
                id: c?.id,
                name,
                nif,
                legalForm,
                activity,
                regime,
                city,
                phone,
                email,
                yearCreated: Number(year) || null,
              },
            });
            await refresh();
            toast.success("Entreprise enregistrée");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
          }
        }}
      >
        <Field label="Raison sociale">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="NIF">
          <Input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="N000…" />
        </Field>
        <Field label="Forme juridique">
          <Select value={legalForm} onChange={(e) => setLegalForm(e.target.value as LegalForm)}>
            {Object.entries(LEGAL_FORM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Activité">
          <Select value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Régime" hint={`Suggestion à CA nul : ${REGIME_LABELS[suggested]}`}>
          <Select value={regime} onChange={(e) => setRegime(e.target.value as Regime)}>
            {Object.entries(REGIME_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ville">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Année de création">
            <Input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
          </Field>
        </div>
        <Field label="Téléphone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
