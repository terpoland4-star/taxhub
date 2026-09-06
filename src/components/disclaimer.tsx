import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { cn } from "@/lib/cn";

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg bg-warn-soft px-3 py-2.5 text-warn",
        compact && "text-xs",
      )}
    >
      <Scale className="mt-0.5 size-4 shrink-0" />
      <p className={cn("leading-snug", compact ? "text-xs" : "text-sm")}>
        Calculs indicatifs — barème non validé par un fiscaliste.{" "}
        <span className="font-medium">Phase Z (validation juridique) en attente.</span>{" "}
        Ceci n’est pas une télédéclaration officielle DGI.{" "}
        <Link to="/validation" className="underline underline-offset-2">
          Voir ce qui attend
        </Link>
      </p>
    </div>
  );
}
