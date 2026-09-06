import { createFileRoute } from "@tanstack/react-router";
import { PhaseZBody } from "@/components/phase-z";

export const Route = createFileRoute("/app/validation")({ component: PhaseZPage });

function PhaseZPage() {
  return (
    <div className="pb-16 lg:pb-0">
      <PhaseZBody />
    </div>
  );
}
