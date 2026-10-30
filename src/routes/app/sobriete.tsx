import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applySobre, computeImpact, IMPACT_FACTORS, projectNational, readSobre } from "@/lib/sobriete";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/sobriete")({ component: SobrietePage });

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

function SobrietePage() {
  const ws = useWorkspace();
  const [sobre, setSobre] = useState(false);
  const [taxpayers, setTaxpayers] = useState("50000");
  const [filings, setFilings] = useState("12");

  useEffect(() => setSobre(readSobre()), []);

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;

  const impact = computeImpact({
    declarations: ws.data?.declarations.length ?? 0,
    payments: ws.data?.payments.filter((p) => p.status === "confirmed").length ?? 0,
    receipts: ws.data?.receipts.length ?? 0,
  });
  const national = projectNational(Number(taxpayers) || 0, Number(filings) || 0);

  const stats = [
    { label: "Feuilles de papier évitées", value: nf.format(impact.sheets) },
    { label: "Déplacements évités", value: nf.format(impact.trips) },
    { label: "Carburant économisé", value: `${nf.format(impact.fuelLitres)} L` },
    { label: "CO₂ évité", value: `${nf.format(impact.kgCo2)} kg` },
    { label: "Heures gagnées", value: nf.format(impact.hoursSaved) },
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Zéro papier</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Sobriété papier et énergie</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Chaque déclaration et chaque paiement faits ici, c'est un formulaire, un bordereau, une
          quittance et un trajet de moins.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-display text-2xl tabular-nums tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium">Mode sobre</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Fond sombre (moins d'énergie sur les écrans OLED des téléphones), animations coupées.
            Utile pendant les délestages, quand la batterie compte.
          </p>
        </div>
        <Button
          variant={sobre ? "primary" : "secondary"}
          onClick={() => {
            applySobre(!sobre);
            setSobre(!sobre);
          }}
        >
          {sobre ? "Mode sobre activé" : "Activer le mode sobre"}
        </Button>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl tracking-tight">Projection nationale</h2>
        <p className="mt-1 text-sm text-muted">Si les contribuables déclaraient et payaient en ligne.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Contribuables">
            <Input inputMode="numeric" value={taxpayers} onChange={(e) => setTaxpayers(e.target.value)} />
          </Field>
          <Field label="Déclarations par an et par contribuable">
            <Input inputMode="numeric" value={filings} onChange={(e) => setFilings(e.target.value)} />
          </Field>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Rames de papier</dt>
            <dd className="font-display text-xl tabular-nums">{nf.format(national.reams)}</dd>
          </div>
          <div>
            <dt className="text-muted">Déplacements</dt>
            <dd className="font-display text-xl tabular-nums">{nf.format(national.trips)}</dd>
          </div>
          <div>
            <dt className="text-muted">Carburant</dt>
            <dd className="font-display text-xl tabular-nums">{nf.format(national.fuelLitres)} L</dd>
          </div>
          <div>
            <dt className="text-muted">CO₂</dt>
            <dd className="font-display text-xl tabular-nums">{nf.format(national.tonnesCo2)} t</dd>
          </div>
          <div>
            <dt className="text-muted">Heures rendues à l'activité</dt>
            <dd className="font-display text-xl tabular-nums">{nf.format(national.hoursSaved)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Hypothèses : déclaration {IMPACT_FACTORS.sheetsPerDeclaration} feuilles, bordereau{" "}
          {IMPACT_FACTORS.sheetsPerPayment}, quittance {IMPACT_FACTORS.sheetsPerReceipt} ; trajet
          aller-retour {IMPACT_FACTORS.tripKm} km à moto ({IMPACT_FACTORS.fuelLitresPer100Km} L/100 km,{" "}
          {IMPACT_FACTORS.kgCo2PerFuelLitre} kg CO₂/L), {IMPACT_FACTORS.minutesPerTrip} min d'attente et
          de trajet. Ordres de grandeur, à affiner avec les données de la DGI.
        </p>
      </section>
    </div>
  );
}
