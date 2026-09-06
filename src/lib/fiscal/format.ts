const xof = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 2,
});

export function num(v: string | number | boolean | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatXof(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return `${xof.format(n)} F CFA`;
}

export function formatXofCompact(value: number): string {
  const n = Math.round(value);
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M F`;
  }
  return formatXof(n);
}

export function formatPercent(rate: number): string {
  return pct.format(rate);
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export const TAX_LABELS: Record<string, string> = {
  tva: "TVA",
  isb: "ISB",
  synthetique: "Impôt synthétique",
};

export const REGIME_LABELS: Record<string, string> = {
  synthetique: "Impôt synthétique",
  reel_simplifie: "Réel simplifié",
  reel_normal: "Réel normal",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  commerce: "Commerce",
  services: "Prestations de services",
  mixte: "Activité mixte",
  industrie: "Industrie",
};

export const LEGAL_FORM_LABELS: Record<string, string> = {
  ei: "Entreprise individuelle",
  sarl: "SARL",
  sa: "SA",
  sucursale: "Succursale",
};

export const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  calculee: "Calculée",
  soumise: "Soumise",
  payee: "Payée",
  en_retard: "En retard",
  pending: "En attente",
  confirmed: "Confirmé",
  failed: "Échoué",
  timeout: "Expiré",
};

export const PROVIDER_LABELS: Record<string, string> = {
  airtel: "Airtel Money",
  moov: "Moov Money",
  card: "Carte bancaire",
};
