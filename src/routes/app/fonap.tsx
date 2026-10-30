import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDue } from "@/lib/fiscal/calendar";
import { assessReadiness, DIGI_PME, FONAP_WINDOWS, SECEF_LABELS, type SecefMode } from "@/lib/fonap";
import { isUnauthorized, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/fonap")({ component: FonapPage });

const LEVEL = {
  pret: { label: "Dossier prêt", tone: "ok" },
  presque: { label: "Presque prêt", tone: "warn" },
  a_construire: { label: "À construire", tone: "danger" },
} as const;

function FonapPage() {
  const ws = useWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  if (ws.isPending) return <div className="h-64 animate-pulse rounded-xl bg-surface-2" />;

  const company = ws.data?.activeCompany ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const readiness = assessReadiness({
    company,
    declarations: ws.data?.declarations ?? [],
    asOfDate: today,
  });
  const level = LEVEL[readiness.level];
  const callOpen = today <= DIGI_PME.lastDeadline;

  const summary = [
    `Dossier FONAP / DIGI-PME — ${company?.name ?? "Entreprise"}`,
    `NIF : ${company?.nif || "à renseigner"}`,
    `RCCM : ${company?.rccm || "à renseigner"}`,
    `Facturation : ${SECEF_LABELS[(company?.secef_mode as SecefMode) ?? "aucun"] ?? "—"}`,
    `Score de préparation : ${readiness.score}/100 (${level.label})`,
    ...readiness.checks.map((c) => `${c.ok ? "[x]" : "[ ]"} ${c.label}`),
    "Généré par NigerTax Pro — indicatif, ne remplace pas l'attestation de régularité fiscale de la DGI.",
  ].join("\n");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Dossier FONAP", text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      toast.success("Synthèse copiée : collez-la dans votre e-mail au FONAP");
    } catch {
      // Partage annulé par l'utilisateur.
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Financement</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">FONAP & DIGI-PME</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Une entreprise à jour de ses impôts est une entreprise finançable. Vos déclarations dans
          NigerTax Pro constituent directement le dossier demandé par le Fonds National d'Appui aux
          PME/PMI, sans photocopie ni déplacement.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col items-start gap-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">Score de préparation</p>
          <p className="font-display text-5xl tabular-nums tracking-tight">
            {readiness.score}
            <span className="text-xl text-subtle">/100</span>
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${readiness.score}%` }} />
          </div>
          <Badge tone={level.tone}>{level.label}</Badge>
          <Button variant="secondary" onClick={share} className="mt-2">
            Partager la synthèse
          </Button>
        </div>

        <ul className="flex flex-col divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {readiness.checks.map((c) => (
            <li key={c.code} className="flex items-start gap-3 px-5 py-3">
              {c.ok ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
              ) : (
                <CircleDashed className="mt-0.5 size-5 shrink-0 text-warn" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", c.ok ? "text-fg" : "font-medium")}>{c.label}</p>
                {!c.ok ? <p className="text-xs text-muted">{c.fix}</p> : null}
              </div>
              {!c.ok && c.fixTo ? (
                <Link to={c.fixTo} className="shrink-0 text-sm font-medium text-accent hover:underline">
                  Corriger
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-tight">Programme {DIGI_PME.name}</h2>
          <Badge tone={callOpen ? "ok" : "neutral"}>
            {callOpen
              ? `Candidatures jusqu'au ${formatDue(DIGI_PME.lastDeadline)}`
              : `Dernier appel clos le ${formatDue(DIGI_PME.lastDeadline)}`}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted">{DIGI_PME.summary}</p>
        <h3 className="mt-4 text-sm font-medium">Pièces demandées</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-muted">
          {DIGI_PME.documents.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Projet de digitalisation tout trouvé : la tenue de vos déclarations, paiements mobiles et
          factures certifiées dans NigerTax Pro.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href={`mailto:${DIGI_PME.contactEmail}?subject=${encodeURIComponent("Candidature DIGI-PME")}&body=${encodeURIComponent(summary)}`}>
              <Mail className="size-4" />
              Écrire au FONAP
            </a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-subtle">
          {DIGI_PME.contactEmail} · {DIGI_PME.address}. Vérifiez la date du prochain appel sur fonap.ne.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl tracking-tight">Les guichets du FONAP</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FONAP_WINDOWS.map((w) => (
            <div key={w.title} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">{w.title}</p>
              <p className="mt-1 text-sm text-muted">{w.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
