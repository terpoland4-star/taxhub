import { Check, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const done = [
  "Comptes utilisateurs et historique persisté",
  "Moteur TVA / ISB / impôt synthétique isolé et testé",
  "Taux versionnés en base, jamais figés dans l’interface",
  "Déclarations, simulation, paiements sandbox Mobile Money",
  "Reçus, export comptable, rappels, calendrier fiscal",
  "Mode cabinet, rôles, marque blanche de base",
];

const waiting = [
  "Revue juridique des formules par un expert-comptable nigérien",
  "Barème officiel de l’impôt synthétique sourcé article par article",
  "Confirmation du taux IMF 2026 (1,5 % vs 1,75 % selon activités)",
  "Homologation Mobile Money auprès des opérateurs",
  "Interopérabilité ou reconnaissance DGI / télédéclaration",
  "Agrément éventuel de prestataire de télédéclaration",
];

export function PhaseZBody() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Phase Z</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          La validation juridique attend.
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          NigerTax Pro est utilisable de A à Y : calcul, déclaration, paiement sandbox, preuve.
          Ce qui ne part pas en production officielle, c’est la certification des formules et le
          canal DGI. Jusque-là, chaque écran porte la mention « indicatif ».
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">Livré (A–Y)</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {done.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-medium">En attente (Z)</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {waiting.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-warn" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="bg-surface-2 shadow-none">
        <p className="text-sm leading-relaxed text-muted">
          Sources publiques utilisées pour le barème indicatif : CGI Niger art. 27 (ISB 30 %) et
          art. 226 (TVA 19 %), calendrier DGI (15 du mois, 30 avril), seuils de régimes publiés sur
          impots.gouv.ne (50 M / 100 M FCFA), IMF 1 % industrie / 1,5 % autres. Le taux de l’impôt
          synthétique est un barème interne, non sourcé — c’est le premier point de la revue
          fiscaliste.
        </p>
      </Card>
    </div>
  );
}
