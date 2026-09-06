import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDue } from "@/lib/fiscal/calendar";
import { formatXof, STATUS_LABELS, TAX_LABELS } from "@/lib/fiscal/format";
import { seedDemo, setActiveCompany } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();

  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  if (ws.isPending) return <DashSkeleton />;
  if (!ws.data) return null;

  const { activeCompany, declarations, deadlines, companies, profile } = ws.data;
  const dueNow = declarations
    .filter((d) => d.status !== "payee" && d.status !== "brouillon")
    .reduce((s, d) => s + d.total_due, 0);
  const paid = declarations.filter((d) => d.status === "payee").reduce((s, d) => s + d.total_due, 0);
  const late = deadlines.filter((d) => d.status === "en_retard").length;

  const chart = declarations
    .slice()
    .reverse()
    .slice(-8)
    .map((d) => ({
      name: d.period_label,
      impot: d.tax_due,
      total: d.total_due,
    }));

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {profile.account_type === "cabinet" ? "Cabinet" : "PME"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            {activeCompany?.name ?? "Votre espace"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {activeCompany
              ? `${activeCompany.city} · NIF ${activeCompany.nif || "non renseigné"}`
              : "Créez une entreprise pour commencer."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {companies.length > 1 ? (
            <select
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
              value={activeCompany?.id ?? ""}
              onChange={async (e) => {
                await setActiveCompany({ data: e.target.value });
                await refresh();
              }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button asChild>
            <Link to="/app/declaration">
              Nouvelle déclaration
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="À régler" value={formatXof(dueNow)} />
        <Kpi label="Déjà payé" value={formatXof(paid)} />
        <Kpi
          label="Échéances en retard"
          value={String(late)}
          warn={late > 0}
        />
      </div>

      {declarations.length === 0 ? (
        <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Aucun dossier pour l’instant</h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Saisissez un chiffre d’affaires, ou chargez un dossier de démonstration (Sahel Négoce,
            Niamey) pour parcourir l’historique, les paiements et les reçus.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/app/declaration">Saisir une déclaration</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await seedDemo();
                  await refresh();
                  toast.success("Dossier de démonstration chargé");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Impossible de charger l’exemple");
                }
              }}
            >
              Charger un exemple
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="text-sm font-medium">Impôt par période</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-muted)" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v) => formatXof(Number(v))}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="impot" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="text-sm font-medium">Prochaines échéances</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {deadlines.slice(0, 5).map((d) => (
                <li key={`${d.taxType}-${d.dueDate}`} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{d.label}</p>
                    <p className="text-xs text-muted">{formatDue(d.dueDate)}</p>
                  </div>
                  <Badge
                    tone={d.status === "en_retard" ? "danger" : d.status === "cette_semaine" ? "warn" : "neutral"}
                  >
                    {d.status === "en_retard" ? "Retard" : d.daysLeft >= 0 ? `${d.daysLeft} j` : ""}
                  </Badge>
                </li>
              ))}
            </ul>
            <Link to="/app/calendrier" className="mt-4 inline-flex text-sm text-accent underline-offset-4 hover:underline">
              Calendrier complet
            </Link>
          </div>
        </div>
      )}

      {declarations.length ? (
        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-medium">Dernières déclarations</h2>
            <span className="text-xs text-muted">
              {format(new Date(), "d MMMM yyyy", { locale: fr })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">Période</th>
                  <th className="px-3 py-2 font-medium">Impôt</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {declarations.slice(0, 8).map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link to="/app/declaration/$id" params={{ id: d.id }} className="font-medium hover:underline">
                        {d.period_label}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted">{TAX_LABELS[d.tax_type] ?? d.tax_type}</td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={
                          d.status === "payee"
                            ? "ok"
                            : d.status === "en_retard"
                              ? "danger"
                              : d.status === "soumise"
                                ? "accent"
                                : "neutral"
                        }
                      >
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatXof(d.total_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl tabular-nums ${warn ? "text-danger" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 w-64 animate-pulse rounded-md bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
