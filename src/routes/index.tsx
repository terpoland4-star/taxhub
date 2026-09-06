import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Lock, Smartphone, Table2 } from "lucide-react";
import { Seal, Wordmark } from "@/components/brand";
import { DisclaimerBanner } from "@/components/disclaimer";
import { SimWidget } from "@/components/sim-widget";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isPending } = useCurrentUserState();
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Seal className="size-8" />
          <Wordmark className="text-lg" />
        </Link>
        <nav className="flex items-center gap-2">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
          ) : (
            <>
              <SignedOut>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/login">Ouvrir un espace</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild size="sm">
                  <Link to="/app">Tableau de bord</Link>
                </Button>
              </SignedIn>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Niger · DGI · FCFA
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
              La conformité fiscale, enfin lisible.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Calculez la TVA, l’ISB et l’impôt synthétique. Déclarez. Payez via Mobile Money.
              Conservez la preuve. Pour les PME de Niamey comme pour les cabinets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/login">
                  Commencer
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/validation">Ce que Z attend</Link>
              </Button>
            </div>
            <div className="mt-8">
              <DisclaimerBanner compact />
            </div>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
            <p className="text-sm font-medium">Échéance la plus proche</p>
            <p className="mt-1 font-display text-3xl tracking-tight">15 septembre 2026</p>
            <p className="mt-1 text-sm text-muted">TVA du mois d’août · régime réel</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-surface-2 p-3">
                <dt className="text-muted">TVA normale</dt>
                <dd className="mt-1 font-display text-xl tabular-nums">19 %</dd>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <dt className="text-muted">ISB</dt>
                <dd className="mt-1 font-display text-xl tabular-nums">30 %</dd>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <dt className="text-muted">Seuil synthétique</dt>
                <dd className="mt-1 font-display text-xl tabular-nums">50 M</dd>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <dt className="text-muted">Réel normal</dt>
                <dd className="mt-1 font-display text-xl tabular-nums">100 M</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            {[
              {
                icon: Table2,
                title: "Moteur isolé",
                body: "TVA, ISB, impôt synthétique. Cas limites couverts : CA nul, seuils de régime, IMF plancher, arrondi au millier.",
              },
              {
                icon: Smartphone,
                title: "Paiement Airtel / Moov",
                body: "Boucle sandbox : initiation, webhook, reçu horodaté. L’homologation opérateur reste en Phase Z.",
              },
              {
                icon: Building2,
                title: "Mode cabinet",
                body: "Plusieurs clients, échéances consolidées, marque blanche. Le segment le plus rentable, déjà branché.",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="size-5 text-accent" />
                <h2 className="mt-3 font-medium">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight">Simuler maintenant</h2>
          <p className="mt-2 max-w-xl text-muted">
            Aucun compte requis. Les taux viennent du barème versionné — ils changeront le jour
            où un fiscaliste les valide.
          </p>
          <div className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-8">
            <SimWidget />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
          <div className="rounded-xl bg-accent px-6 py-8 text-accent-fg">
            <Lock className="size-5 opacity-80" />
            <h2 className="mt-4 font-display text-2xl font-medium">PME seule</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              Un compte, une entreprise, un historique. Saisir le CA, obtenir le calcul, le
              retrouver après reconnexion.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/login">Créer mon espace</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface px-6 py-8 shadow-[var(--shadow-border)]">
            <Building2 className="size-5 text-accent" />
            <h2 className="mt-4 font-display text-2xl font-medium">Cabinet comptable</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Portefeuille clients, rôles, rappel des échéances, export pour la liasse. La
              facturation interne se cale sur le nombre de dossiers.
            </p>
            <Button asChild className="mt-6">
              <Link to="/login">Ouvrir un cabinet</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-sm text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <p>Prototype A–Y · validation juridique non effectuée.</p>
        </div>
      </footer>
    </div>
  );
}
