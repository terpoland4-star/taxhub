// Veille juridique : textes fiscaux en vigueur au Niger en 2026. Each entry
// carries its status so the UI never presents an unconfirmed measure as law.

export type WatchStatus = "en_vigueur" | "abrogee_a_confirmer" | "a_confirmer";

export type WatchItem = {
  title: string;
  reference: string;
  status: WatchStatus;
  summary: string;
  impact: string;
};

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  en_vigueur: "En vigueur",
  abrogee_a_confirmer: "Abrogée (à confirmer au JO)",
  a_confirmer: "À confirmer",
};

export const LEGAL_WATCH: WatchItem[] = [
  {
    title: "Nouveau Code général des impôts",
    reference: "Ordonnance n°2025-22 du 14 juillet 2025, applicable au 1er janvier 2026",
    status: "en_vigueur",
    summary:
      "Refonte du CGI pour l'harmoniser avec les normes UEMOA. Révision du plafonnement des frais de siège et d'assistance technique entre entreprises liées. Procédure de rescrit fiscal désormais encadrée par la loi.",
    impact: "Les déclarations portant sur 2026 relèvent du nouveau code ; les périodes antérieures restent régies par l'ancien.",
  },
  {
    title: "Loi de finances 2026",
    reference: "Ordonnance n°2025-44 du 31 décembre 2025",
    status: "en_vigueur",
    summary:
      "Rationalisation des exonérations, application du taux normal de TVA de 19 % à des opérations auparavant exonérées ou à taux réduit, hausse du taux minimal d'impôt sur les bénéfices pour certaines activités.",
    impact: "Le moteur de calcul garde ses taux réduits « à valider » tant que la liste produit par produit n'est pas confirmée.",
  },
  {
    title: "TVA – exonérations sociales maintenues",
    reference: "Précisions de la DGI, janvier 2026",
    status: "en_vigueur",
    summary:
      "Les tranches sociales de consommation d'eau et d'électricité des ménages restent exonérées, ainsi que les produits agricoles locaux et pharmaceutiques sous conditions.",
    impact: "Aucun changement pour les ménages sur ces postes.",
  },
  {
    title: "ITS – barème inchangé",
    reference: "LF 2026 ; DGI et CDTN, janvier 2026",
    status: "en_vigueur",
    summary: "Le barème de l'impôt sur les traitements et salaires reste celui de la loi de finances précédente.",
    impact: "Pas de recalcul des retenues sur salaires.",
  },
  {
    title: "Facture certifiée (SECeF)",
    reference: "LF 2020 et 2021 ; CGI ; circulaire n°67 du 2 septembre 2025 sur la facture d'avoir certifiée",
    status: "en_vigueur",
    summary:
      "Obligation d'émettre des factures certifiées (NIM, code SECeF/DGI, QR code). Charges et TVA déductibles seulement sur facture certifiée, sauf dérogation. e-SECeF permet aux contribuables de l'impôt synthétique (NIF P) de certifier gratuitement en ligne.",
    impact: "Condition de déductibilité : un point de contrôle de l'éligibilité FONAP dans l'application.",
  },
  {
    title: "Taxe sur les dépôts et transferts d'argent (TDTA)",
    reference: "LF 2026 ; loi modificative signalée au 21 août 2026",
    status: "abrogee_a_confirmer",
    summary:
      "Prélèvement de 0,5 % (5 % au-delà de 2 000 000 F CFA selon certaines sources) sur les dépôts et transferts de compte à compte. Une source secondaire indique son abrogation à compter du 21 août 2026.",
    impact: "Non intégrée au moteur. À vérifier au Journal officiel avant toute communication.",
  },
  {
    title: "Taxe de 1 % sur certains paiements en espèces",
    reference: "LF 2026, citée par la DGI",
    status: "a_confirmer",
    summary: "Mesure présentée comme incitation au paiement électronique. Champ d'application précis non publié en ligne.",
    impact: "Argument supplémentaire pour le paiement mobile intégré à l'application.",
  },
];
