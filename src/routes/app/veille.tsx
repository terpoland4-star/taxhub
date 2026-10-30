import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/card";
import { LEGAL_WATCH, WATCH_STATUS_LABELS, type WatchStatus } from "@/lib/fiscal/legal-watch";

export const Route = createFileRoute("/app/veille")({ component: WatchPage });

const TONE: Record<WatchStatus, "ok" | "warn" | "neutral"> = {
  en_vigueur: "ok",
  abrogee_a_confirmer: "neutral",
  a_confirmer: "warn",
};

function WatchPage() {
  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Veille juridique</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Textes fiscaux 2026</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Ce qui s'applique cette année et ce que cela change dans l'application. Une mesure n'est
          intégrée au moteur de calcul qu'une fois confirmée au Journal officiel.
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {LEGAL_WATCH.map((item) => (
          <li key={item.title} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-medium">{item.title}</h2>
              <Badge tone={TONE[item.status]}>{WATCH_STATUS_LABELS[item.status]}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-subtle">{item.reference}</p>
            <p className="mt-3 text-sm text-muted">{item.summary}</p>
            <p className="mt-2 text-sm">
              <span className="font-medium">Dans NigerTax Pro : </span>
              {item.impact}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
