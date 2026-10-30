// Paper and energy avoided by filing and paying online instead of at a tax
// office. Every factor is a stated assumption shown to the user, never hidden:
// the figures are orders of magnitude for a pitch, not an audited footprint.

export type ImpactFactors = {
  sheetsPerDeclaration: number;
  sheetsPerPayment: number;
  sheetsPerReceipt: number;
  tripKm: number;
  fuelLitresPer100Km: number;
  kgCo2PerFuelLitre: number;
  gramsCo2PerSheet: number;
  minutesPerTrip: number;
};

export const IMPACT_FACTORS: ImpactFactors = {
  // Formulaire en 2 exemplaires (contribuable + service) ~ 2 pages chacun.
  sheetsPerDeclaration: 4,
  // Bordereau de versement en 2 exemplaires.
  sheetsPerPayment: 2,
  // Quittance papier.
  sheetsPerReceipt: 1,
  // Aller-retour moyen vers un centre des impôts en ville, à moto.
  tripKm: 10,
  fuelLitresPer100Km: 3,
  kgCo2PerFuelLitre: 2.3,
  // Ordre de grandeur courant pour une feuille A4 de 80 g.
  gramsCo2PerSheet: 5,
  minutesPerTrip: 120,
};

export type ImpactInput = {
  declarations: number;
  payments: number;
  receipts: number;
};

export type Impact = {
  sheets: number;
  trips: number;
  fuelLitres: number;
  kgCo2: number;
  hoursSaved: number;
};

export function computeImpact(input: ImpactInput, f: ImpactFactors = IMPACT_FACTORS): Impact {
  const sheets =
    input.declarations * f.sheetsPerDeclaration +
    input.payments * f.sheetsPerPayment +
    input.receipts * f.sheetsPerReceipt;
  // One trip to file, one to pay: online filing removes both.
  const trips = input.declarations + input.payments;
  const fuelLitres = (trips * f.tripKm * f.fuelLitresPer100Km) / 100;
  const kgCo2 = fuelLitres * f.kgCo2PerFuelLitre + (sheets * f.gramsCo2PerSheet) / 1000;
  const hoursSaved = (trips * f.minutesPerTrip) / 60;
  return {
    sheets,
    trips,
    fuelLitres: round1(fuelLitres),
    kgCo2: round1(kgCo2),
    hoursSaved: round1(hoursSaved),
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// National projection for the DGI pitch: N taxpayers filing M times a year.
export function projectNational(taxpayers: number, filingsPerYear: number, f: ImpactFactors = IMPACT_FACTORS) {
  const per = computeImpact({ declarations: filingsPerYear, payments: filingsPerYear, receipts: filingsPerYear }, f);
  return {
    sheets: per.sheets * taxpayers,
    reams: Math.round((per.sheets * taxpayers) / 500),
    trips: per.trips * taxpayers,
    fuelLitres: Math.round(per.fuelLitres * taxpayers),
    tonnesCo2: Math.round((per.kgCo2 * taxpayers) / 100) / 10,
    hoursSaved: Math.round(per.hoursSaved * taxpayers),
  };
}

const SOBRE_KEY = "nigertax:sobre";

export function readSobre(): boolean {
  try {
    return localStorage.getItem(SOBRE_KEY) === "1";
  } catch {
    return false;
  }
}

export function applySobre(on: boolean) {
  try {
    localStorage.setItem(SOBRE_KEY, on ? "1" : "0");
  } catch {
    // Storage blocked: the mode still applies for this visit.
  }
  document.documentElement.toggleAttribute("data-sobre", on);
}
