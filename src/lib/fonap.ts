// FONAP (Fonds National d'Appui aux PME/PMI) and its DIGI-PME digitalisation
// programme. FONAP calls require a company legally registered in Niger with a
// NIF and an RCCM; a clean tax record is what turns those identifiers into a
// credible file. This module scores that readiness from data the app already
// holds, so the same work that files taxes also prepares the funding file.

export const SECEF_MODES = ["aucun", "e_secef", "machine"] as const;
export type SecefMode = (typeof SECEF_MODES)[number];

export const SECEF_LABELS: Record<SecefMode, string> = {
  aucun: "Pas encore de facture certifiée",
  e_secef: "e-SECeF (plateforme DGI en ligne, gratuite)",
  machine: "Machine SECeF / logiciel homologué (SFE + MCF)",
};

export type ReadinessInput = {
  company: {
    nif: string;
    rccm: string;
    secef_mode: string;
    phone: string;
    email: string;
  } | null;
  declarations: { status: string; due_date: string; submitted_at: string | null }[];
  asOfDate: string;
};

export type ReadinessCheck = {
  code: string;
  label: string;
  ok: boolean;
  weight: number;
  fix: string;
  fixTo?: string;
};

export type Readiness = {
  score: number;
  checks: ReadinessCheck[];
  level: "pret" | "presque" | "a_construire";
};

const UNPAID = new Set(["brouillon", "calculee", "soumise", "en_retard"]);

export function assessReadiness({ company, declarations, asOfDate }: ReadinessInput): Readiness {
  const yearAgo = new Date(`${asOfDate}T00:00:00Z`);
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  const since = yearAgo.toISOString().slice(0, 10);

  const overdue = declarations.filter(
    (d) => d.status === "en_retard" || (UNPAID.has(d.status) && d.due_date < asOfDate),
  );
  const filedRecently = declarations.some(
    (d) => (d.status === "soumise" || d.status === "payee") && d.due_date >= since,
  );

  const checks: ReadinessCheck[] = [
    {
      code: "nif",
      label: "NIF renseigné",
      ok: Boolean(company?.nif.trim()),
      weight: 25,
      fix: "Ajoutez votre Numéro d'Identification Fiscale.",
      fixTo: "/app/entreprise",
    },
    {
      code: "rccm",
      label: "RCCM renseigné",
      ok: Boolean(company?.rccm.trim()),
      weight: 20,
      fix: "Ajoutez votre numéro au Registre du Commerce et du Crédit Mobilier.",
      fixTo: "/app/entreprise",
    },
    {
      code: "secef",
      label: "Factures certifiées (SECeF)",
      ok: company?.secef_mode === "e_secef" || company?.secef_mode === "machine",
      weight: 15,
      fix: "Activez e-SECeF (gratuit pour l'impôt synthétique) ou une machine SECeF homologuée.",
      fixTo: "/app/entreprise",
    },
    {
      code: "a_jour",
      label: "Aucune déclaration en retard",
      ok: overdue.length === 0,
      weight: 20,
      fix: `${overdue.length} déclaration(s) à régulariser avant de candidater.`,
      fixTo: "/app/declaration",
    },
    {
      code: "historique",
      label: "Au moins une déclaration déposée sur 12 mois",
      ok: filedRecently,
      weight: 10,
      fix: "Déposez une déclaration pour constituer un historique fiscal.",
      fixTo: "/app/declaration",
    },
    {
      code: "contact",
      label: "Téléphone et e-mail de contact",
      ok: Boolean(company?.phone.trim() && company?.email.trim()),
      weight: 10,
      fix: "Le FONAP contacte les candidats par téléphone et e-mail.",
      fixTo: "/app/entreprise",
    },
  ];

  const score = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const level = score >= 90 ? "pret" : score >= 60 ? "presque" : "a_construire";
  return { score, checks, level };
}

export type FundingWindow = { title: string; detail: string };

// Les quatre guichets décrits dans l'appel à projets FONAP-2022.
export const FONAP_WINDOWS: FundingWindow[] = [
  { title: "Prêts et prises de participation", detail: "Financement direct ou entrée au capital de la PME/PMI." },
  { title: "Bonification des taux d'intérêt", detail: "Réduit le coût du crédit bancaire obtenu auprès d'une institution partenaire." },
  { title: "Crédit-bail (leasing)", detail: "Équipements productifs sans immobiliser la trésorerie." },
  { title: "Subventions d'assistance", detail: "Appui technique, formation et accompagnement à la gestion." },
];

export const DIGI_PME = {
  name: "DIGI-PME",
  summary:
    "Programme FONAP de digitalisation des PME/PMI (PTBA 2026) : accompagnement de 15 PME/PMI lauréates pour concevoir, financer, déployer et pérenniser une solution numérique.",
  lastDeadline: "2026-10-09",
  contactEmail: "digipmeniger@fonap.ne",
  address: "Siège du FONAP, avenue Djibo Bakary, Niamey",
  documents: [
    "Preuve d'enregistrement légal au Niger : NIF et RCCM",
    "Copie de la pièce d'identité du promoteur",
    "Projet de digitalisation clairement défini (besoin, solution, budget, calendrier)",
  ],
} as const;
