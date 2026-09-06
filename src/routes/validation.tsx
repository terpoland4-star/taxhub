import { createFileRoute, Link } from "@tanstack/react-router";
import { Seal, Wordmark } from "@/components/brand";
import { PhaseZBody } from "@/components/phase-z";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/validation")({ component: ValidationPage });

function ValidationPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Seal className="size-8" />
          <Wordmark />
        </Link>
        <Button asChild variant="secondary" size="sm">
          <Link to="/">Retour</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PhaseZBody />
      </main>
    </div>
  );
}
