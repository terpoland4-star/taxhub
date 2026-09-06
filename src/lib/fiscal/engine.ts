import {
  DEFAULT_RATES,
  type Activity,
  type ComputeInput,
  type ComputeResult,
  type LegalForm,
  type LineItem,
  type RateTable,
  type Regime,
} from "./types";

export const LEGAL_BANNER =
  "Calculs indicatifs — barème non validé par un fiscaliste. Phase Z (validation juridique) en attente. Ne constitue pas une déclaration officielle auprès de la DGI.";

export function roundFcfa(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function roundDownToThousand(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n / 1000) * 1000;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.floor((to - from) / 86_400_000);
}

export function recommendRegime(input: {
  legalForm: LegalForm;
  caHt: number;
  caTtc: number;
  rates?: RateTable;
}): Regime {
  const rates = input.rates ?? DEFAULT_RATES;
  if (input.legalForm === "sarl" || input.legalForm === "sa" || input.legalForm === "sucursale") {
    return "reel_normal";
  }
  if (input.caHt > rates.thresholdReelNormal) return "reel_normal";
  if (input.caHt >= rates.thresholdReelSimplifie) return "reel_simplifie";
  if (input.caTtc >= rates.thresholdSynthetique && input.caHt < rates.thresholdReelSimplifie) {
    return "reel_simplifie";
  }
  return "synthetique";
}

function synthetiqueRate(activity: Activity, rates: RateTable): number {
  if (activity === "services") return rates.synthetiqueServices;
  if (activity === "mixte") return rates.synthetiqueMixte;
  return rates.synthetiqueCommerce;
}

function computePenalties(
  taxDue: number,
  dueDate: string,
  asOfDate: string,
  rates: RateTable,
): { penalty: number; interest: number; daysLate: number } {
  if (taxDue <= 0) return { penalty: 0, interest: 0, daysLate: 0 };
  const daysLate = Math.max(0, daysBetween(dueDate, asOfDate));
  if (daysLate <= 0) return { penalty: 0, interest: 0, daysLate: 0 };
  let rate = rates.penaltyLate;
  if (daysLate <= 30) rate = rates.penalty30;
  else if (daysLate <= 90) rate = rates.penalty90;
  const penalty = roundFcfa(taxDue * rate);
  const months = Math.ceil(daysLate / 30);
  const interest = roundFcfa(taxDue * rates.interestMonthly * months);
  return { penalty, interest, daysLate };
}

function tvaResult(input: ComputeInput, rates: RateTable): ComputeResult {
  const salesRate = input.salesTvaRate ?? rates.tvaStandard;
  const purchaseRate = input.tvaOnPurchasesRate ?? rates.tvaStandard;
  const collected = roundFcfa(input.caHt * salesRate);
  const deductible = roundFcfa(input.purchasesHt * purchaseRate);
  const net = collected - deductible;
  const taxDue = Math.max(0, net);
  const credit = Math.max(0, -net);
  const asOf = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  const { penalty, interest, daysLate } = computePenalties(taxDue, input.dueDate, asOf, rates);
  const lines: LineItem[] = [
    { code: "ca_ht", label: "Chiffre d'affaires HT", amount: roundFcfa(input.caHt) },
    {
      code: "tva_collectee",
      label: `TVA collectée (${(salesRate * 100).toFixed(0)} %)`,
      amount: collected,
    },
    { code: "achats_ht", label: "Achats / charges HT", amount: roundFcfa(input.purchasesHt) },
    {
      code: "tva_deductible",
      label: `TVA déductible (${(purchaseRate * 100).toFixed(0)} %)`,
      amount: deductible,
    },
    { code: "tva_nette", label: net >= 0 ? "TVA nette à payer" : "Crédit de TVA", amount: net },
  ];
  const notes: string[] = [];
  if (input.caHt === 0 && input.purchasesHt === 0) {
    notes.push("CA et achats nuls : déclaration néant, aucune TVA due.");
  }
  if (credit > 0) notes.push("Crédit de TVA reportable sur les périodes suivantes (indicatif).");
  if (input.regime === "synthetique") {
    notes.push("Le régime de l'impôt synthétique n'est en principe pas assujetti à la TVA. Ce calcul est fourni à titre de simulation.");
  }
  if (daysLate > 0) notes.push(`Retard de ${daysLate} jour(s) par rapport à l'échéance.`);
  return finalize(input, rates, {
    taxDue,
    penalty,
    interest,
    credit,
    lines,
    notes,
  });
}

function isbResult(input: ComputeInput, rates: RateTable): ComputeResult {
  const profit = roundFcfa(input.caHt - input.expenses);
  const taxable = Math.max(0, profit);
  const rawIsb = taxable * rates.isbRate;
  const isb = roundDownToThousand(rawIsb);
  const ifmRate = input.activity === "industrie" ? rates.ifmIndustry : rates.ifmOther;
  const year = new Date(input.asOfDate ?? Date.now()).getFullYear();
  const newCompany =
    typeof input.yearCreated === "number" && year - input.yearCreated < 2;
  const ifmRaw = newCompany ? 0 : roundFcfa(input.caHt * ifmRate);
  const taxDue = Math.max(isb, ifmRaw);
  const applied = taxDue === ifmRaw && ifmRaw > isb ? "ifm" : "isb";
  const asOf = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  const { penalty, interest, daysLate } = computePenalties(taxDue, input.dueDate, asOf, rates);
  const lines: LineItem[] = [
    { code: "ca_ht", label: "Chiffre d'affaires HT", amount: roundFcfa(input.caHt) },
    { code: "charges", label: "Charges déductibles", amount: roundFcfa(input.expenses) },
    { code: "benefice", label: "Bénéfice net (indicatif)", amount: profit },
    {
      code: "isb",
      label: `ISB 30 % arrondi au millier inférieur`,
      amount: isb,
      note: `Avant arrondi : ${roundFcfa(rawIsb)} F CFA`,
    },
    {
      code: "ifm",
      label: newCompany
        ? "IMF (exonéré — 2 premiers exercices)"
        : `IMF ${(ifmRate * 100).toFixed(2)} % du CA HT`,
      amount: ifmRaw,
    },
    {
      code: "due",
      label: applied === "ifm" ? "Cotisation retenue : IMF (plancher)" : "Cotisation retenue : ISB",
      amount: taxDue,
    },
  ];
  const notes: string[] = [];
  if (input.caHt === 0) notes.push("CA nul : ISB et IMF à zéro.");
  if (profit < 0) notes.push("Déficit : l'ISB est nul ; l'IMF peut rester dû hors exonération.");
  if (newCompany) notes.push("Exonération d'IMF des deux premiers exercices, sous réserve de déclaration dans les délais.");
  if (daysLate > 0) notes.push(`Retard de ${daysLate} jour(s).`);
  return finalize(input, rates, { taxDue, penalty, interest, credit: 0, lines, notes });
}

function synthetiqueResult(input: ComputeInput, rates: RateTable): ComputeResult {
  const base = input.caTtc > 0 ? input.caTtc : input.caHt;
  const rate = synthetiqueRate(input.activity, rates);
  const raw = roundFcfa(base * rate);
  const taxDue = base === 0 ? 0 : Math.max(raw, rates.synthetiqueMin);
  const asOf = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  const { penalty, interest, daysLate } = computePenalties(taxDue, input.dueDate, asOf, rates);
  const lines: LineItem[] = [
    { code: "ca", label: "Assiette (CA TTC, à défaut CA HT)", amount: roundFcfa(base) },
    {
      code: "taux",
      label: `Taux synthétique ${(rate * 100).toFixed(0)} % (${input.activity})`,
      amount: raw,
    },
    { code: "minimum", label: "Plancher indicatif", amount: rates.synthetiqueMin },
    { code: "due", label: "Impôt synthétique dû", amount: taxDue },
  ];
  const notes: string[] = [
    "Barème synthétique interne, non sourcé dans un article CGI publié. Validation fiscaliste requise.",
  ];
  if (base === 0) notes.push("CA nul : impôt synthétique à zéro (pas d'application du plancher).");
  if (raw < rates.synthetiqueMin && base > 0) notes.push("Le plancher indicatif s'applique.");
  if (daysLate > 0) notes.push(`Retard de ${daysLate} jour(s).`);
  return finalize(input, rates, { taxDue, penalty, interest, credit: 0, lines, notes });
}

function finalize(
  input: ComputeInput,
  rates: RateTable,
  part: {
    taxDue: number;
    penalty: number;
    interest: number;
    credit: number;
    lines: LineItem[];
    notes: string[];
  },
): ComputeResult {
  const recommended = recommendRegime({
    legalForm: input.legalForm,
    caHt: input.caHt,
    caTtc: input.caTtc,
    rates,
  });
  let regimeWarning: string | null = null;
  if (recommended !== input.regime) {
    regimeWarning = `Le CA saisi suggère le régime « ${recommended} », alors que l'entreprise est paramétrée en « ${input.regime} ».`;
  }
  return {
    taxType: input.taxType,
    regime: input.regime,
    recommendedRegime: recommended,
    regimeWarning,
    taxDue: part.taxDue,
    penalty: part.penalty,
    interest: part.interest,
    totalDue: part.taxDue + part.penalty + part.interest,
    credit: part.credit,
    lines: part.lines,
    notes: part.notes,
    legalBanner: LEGAL_BANNER,
  };
}

export function computeDeclaration(
  input: ComputeInput,
  rates: RateTable = DEFAULT_RATES,
): ComputeResult {
  const safe: ComputeInput = {
    ...input,
    caHt: Math.max(0, input.caHt || 0),
    caTtc: Math.max(0, input.caTtc || 0),
    purchasesHt: Math.max(0, input.purchasesHt || 0),
    expenses: Math.max(0, input.expenses || 0),
  };
  if (safe.taxType === "tva") return tvaResult(safe, rates);
  if (safe.taxType === "isb") return isbResult(safe, rates);
  return synthetiqueResult(safe, rates);
}

export function ratesFromRows(
  rows: { code: string; value_numeric: string | number }[],
): RateTable {
  const map = new Map<string, number>();
  for (const row of rows) {
    const n = typeof row.value_numeric === "number" ? row.value_numeric : Number(row.value_numeric);
    if (Number.isFinite(n)) map.set(row.code, n);
  }
  const pick = (code: string, fallback: number) => map.get(code) ?? fallback;
  return {
    tvaStandard: pick("tva_standard", DEFAULT_RATES.tvaStandard),
    tvaReduced10: pick("tva_reduced_10", DEFAULT_RATES.tvaReduced10),
    tvaReduced5: pick("tva_reduced_5", DEFAULT_RATES.tvaReduced5),
    isbRate: pick("isb_rate", DEFAULT_RATES.isbRate),
    ifmIndustry: pick("ifm_industry", DEFAULT_RATES.ifmIndustry),
    ifmOther: pick("ifm_other", DEFAULT_RATES.ifmOther),
    synthetiqueCommerce: pick("synthetique_commerce", DEFAULT_RATES.synthetiqueCommerce),
    synthetiqueServices: pick("synthetique_services", DEFAULT_RATES.synthetiqueServices),
    synthetiqueMixte: pick("synthetique_mixte", DEFAULT_RATES.synthetiqueMixte),
    synthetiqueMin: pick("synthetique_min", DEFAULT_RATES.synthetiqueMin),
    thresholdSynthetique: pick("threshold_synthetique", DEFAULT_RATES.thresholdSynthetique),
    thresholdReelSimplifie: pick("threshold_reel_simplifie", DEFAULT_RATES.thresholdReelSimplifie),
    thresholdReelNormal: pick("threshold_reel_normal", DEFAULT_RATES.thresholdReelNormal),
    penalty30: pick("penalty_30", DEFAULT_RATES.penalty30),
    penalty90: pick("penalty_90", DEFAULT_RATES.penalty90),
    penaltyLate: pick("penalty_late", DEFAULT_RATES.penaltyLate),
    interestMonthly: pick("interest_monthly", DEFAULT_RATES.interestMonthly),
  };
}
