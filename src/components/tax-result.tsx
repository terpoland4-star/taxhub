import type { ComputeResult } from "@/lib/fiscal/types";
import { formatPercent, formatXof } from "@/lib/fiscal/format";
import { cn } from "@/lib/cn";

export function TaxResult({
  result,
  className,
}: {
  result: ComputeResult;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Impôt calculé" value={formatXof(result.taxDue)} />
        <Stat
          label="Pénalités + intérêts"
          value={formatXof(result.penalty + result.interest)}
          tone={result.penalty > 0 ? "danger" : "muted"}
        />
        <Stat
          label="Total à payer"
          value={formatXof(result.totalDue)}
          emphasize
        />
      </div>
      {result.credit > 0 ? (
        <p className="rounded-md bg-ok-soft px-3 py-2 text-sm text-ok">
          Crédit de TVA : {formatXof(result.credit)}
        </p>
      ) : null}
      {result.regimeWarning ? (
        <p className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
          {result.regimeWarning}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <tbody>
            {result.lines.map((line) => (
              <tr key={line.code} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted">{line.label}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {formatXof(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.notes.length ? (
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {result.notes.map((n) => (
            <li key={n}>— {n}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs leading-relaxed text-subtle">{result.legalBanner}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
  tone = "fg",
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: "fg" | "muted" | "danger";
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl tabular-nums tracking-tight",
          emphasize && "text-accent",
          tone === "danger" && "text-danger",
          tone === "muted" && "text-muted",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function RateChip({ label, rate }: { label: string; rate: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
      {label}
      <span className="font-medium tabular-nums text-fg">{formatPercent(rate)}</span>
    </span>
  );
}
