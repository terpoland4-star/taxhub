import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fiscalDeadlines, formatDue } from "@/lib/fiscal/calendar";
import { TAX_LABELS } from "@/lib/fiscal/format";
import type { Regime } from "@/lib/fiscal/types";
import { sendReminder } from "@/lib/server/workspace";
import { isUnauthorized, useRefreshWorkspace, useWorkspace } from "@/lib/use-workspace";
import { RedirectToSignIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/app/calendrier")({ component: CalendarPage });

function CalendarPage() {
  const ws = useWorkspace();
  const refresh = useRefreshWorkspace();
  if (ws.isError && isUnauthorized(ws.error)) return <RedirectToSignIn />;
  const regime = (ws.data?.activeCompany?.regime as Regime) ?? "synthetique";
  const all = fiscalDeadlines(regime);
  const company = ws.data?.activeCompany;
  const sent = ws.data?.reminders ?? [];

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">DGI · 2026</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Calendrier fiscal</h1>
        <p className="mt-1 text-sm text-muted">
          TVA au 15 (mensuel ou trimestriel selon le régime). ISB au 30 avril. Impôt synthétique par trimestre.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {all.map((d) => (
          <li
            key={`${d.taxType}-${d.dueDate}-${d.label}`}
            className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{d.label}</p>
              <p className="text-sm text-muted">
                {TAX_LABELS[d.taxType]} · échoir le {formatDue(d.dueDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={d.status === "en_retard" ? "danger" : d.status === "cette_semaine" ? "warn" : "neutral"}>
                {d.status === "en_retard" ? "En retard" : d.status === "cette_semaine" ? "Cette semaine" : `${d.daysLeft} jours`}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                disabled={!company}
                onClick={async () => {
                  if (!company) return;
                  try {
                    await sendReminder({
                      data: {
                        companyId: company.id,
                        taxType: d.taxType,
                        dueDate: d.dueDate,
                        channel: "sms",
                        message: `Rappel ${d.label} — échéance ${d.dueDate} (${company.name})`,
                      },
                    });
                    await refresh();
                    toast.success("Rappel SMS sandbox envoyé");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Envoi impossible");
                  }
                }}
              >
                Rappeler
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {sent.length ? (
        <div>
          <h2 className="mb-2 text-sm font-medium">Rappels envoyés</h2>
          <ul className="text-sm text-muted">
            {sent.map((r) => (
              <li key={r.id}>
                {r.channel.toUpperCase()} · {r.due_date} · {r.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
