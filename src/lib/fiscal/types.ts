export const TAX_TYPES = ["tva", "isb", "synthetique"] as const;
export type TaxType = (typeof TAX_TYPES)[number];

export const REGIMES = ["synthetique", "reel_simplifie", "reel_normal"] as const;
export type Regime = (typeof REGIMES)[number];

export const ACTIVITIES = ["commerce", "services", "mixte", "industrie"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const LEGAL_FORMS = ["ei", "sarl", "sa", "sucursale"] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export type RateTable = {
  tvaStandard: number;
  tvaReduced10: number;
  tvaReduced5: number;
  isbRate: number;
  ifmIndustry: number;
  ifmOther: number;
  synthetiqueCommerce: number;
  synthetiqueServices: number;
  synthetiqueMixte: number;
  synthetiqueMin: number;
  thresholdSynthetique: number;
  thresholdReelSimplifie: number;
  thresholdReelNormal: number;
  penalty30: number;
  penalty90: number;
  penaltyLate: number;
  interestMonthly: number;
};

export const DEFAULT_RATES: RateTable = {
  tvaStandard: 0.19,
  tvaReduced10: 0.1,
  tvaReduced5: 0.05,
  isbRate: 0.3,
  ifmIndustry: 0.01,
  ifmOther: 0.015,
  synthetiqueCommerce: 0.03,
  synthetiqueServices: 0.05,
  synthetiqueMixte: 0.04,
  synthetiqueMin: 25_000,
  thresholdSynthetique: 50_000_000,
  thresholdReelSimplifie: 50_000_000,
  thresholdReelNormal: 100_000_000,
  penalty30: 0.05,
  penalty90: 0.1,
  penaltyLate: 0.15,
  interestMonthly: 0.01,
};

export type ComputeInput = {
  taxType: TaxType;
  regime: Regime;
  activity: Activity;
  legalForm: LegalForm;
  yearCreated?: number | null;
  caHt: number;
  caTtc: number;
  purchasesHt: number;
  tvaOnPurchasesRate?: number;
  salesTvaRate?: number;
  expenses: number;
  dueDate: string;
  asOfDate?: string;
};

export type LineItem = {
  code: string;
  label: string;
  amount: number;
  note?: string;
};

export type ComputeResult = {
  taxType: TaxType;
  regime: Regime;
  recommendedRegime: Regime;
  regimeWarning: string | null;
  taxDue: number;
  penalty: number;
  interest: number;
  totalDue: number;
  credit: number;
  lines: LineItem[];
  notes: string[];
  legalBanner: string;
};

export type Deadline = {
  taxType: TaxType;
  label: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  daysLeft: number;
  status: "a_venir" | "cette_semaine" | "en_retard";
};
