import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDeclaration,
  recommendRegime,
  roundDownToThousand,
} from "./engine.ts";
import { DEFAULT_RATES, type ComputeInput } from "./types.ts";

const base = (over: Partial<ComputeInput>): ComputeInput => ({
  taxType: "tva",
  regime: "reel_normal",
  activity: "commerce",
  legalForm: "sarl",
  caHt: 0,
  caTtc: 0,
  purchasesHt: 0,
  expenses: 0,
  dueDate: "2026-09-15",
  asOfDate: "2026-09-06",
  ...over,
});

describe("roundDownToThousand", () => {
  it("rounds 1 250 400 down to 1 250 000", () => {
    assert.equal(roundDownToThousand(1_250_400), 1_250_000);
  });
  it("returns 0 for zero or negative", () => {
    assert.equal(roundDownToThousand(0), 0);
    assert.equal(roundDownToThousand(-12), 0);
  });
});

describe("recommendRegime", () => {
  it("forces réel normal for companies", () => {
    assert.equal(
      recommendRegime({ legalForm: "sarl", caHt: 1_000_000, caTtc: 1_190_000 }),
      "reel_normal",
    );
  });
  it("uses synthetique below 50M TTC for EI", () => {
    assert.equal(
      recommendRegime({ legalForm: "ei", caHt: 10_000_000, caTtc: 10_000_000 }),
      "synthetique",
    );
  });
  it("uses réel simplifié between 50M and 100M HT", () => {
    assert.equal(
      recommendRegime({ legalForm: "ei", caHt: 60_000_000, caTtc: 71_400_000 }),
      "reel_simplifie",
    );
  });
  it("uses réel normal above 100M HT", () => {
    assert.equal(
      recommendRegime({ legalForm: "ei", caHt: 120_000_000, caTtc: 142_800_000 }),
      "reel_normal",
    );
  });
});

describe("TVA", () => {
  it("computes net VAT on standard 19%", () => {
    const r = computeDeclaration(
      base({ caHt: 1_000_000, purchasesHt: 200_000, taxType: "tva" }),
    );
    assert.equal(r.taxDue, 152_000);
    assert.equal(r.credit, 0);
  });
  it("returns a credit when deductible exceeds collected", () => {
    const r = computeDeclaration(
      base({ caHt: 100_000, purchasesHt: 500_000, taxType: "tva" }),
    );
    assert.equal(r.taxDue, 0);
    assert.equal(r.credit, 76_000);
  });
  it("handles zero turnover as néant", () => {
    const r = computeDeclaration(base({ taxType: "tva" }));
    assert.equal(r.taxDue, 0);
    assert.ok(r.notes.some((n) => /néant/i.test(n)));
  });
});

describe("ISB", () => {
  it("takes 30% of profit rounded down to a thousand", () => {
    const r = computeDeclaration(
      base({
        taxType: "isb",
        caHt: 10_000_000,
        expenses: 4_000_000,
        activity: "industrie",
        yearCreated: 2020,
      }),
    );
    // profit 6_000_000 * 30% = 1_800_000 ; IFM industry 1% of 10M = 100_000
    assert.equal(r.taxDue, 1_800_000);
  });
  it("applies IMF floor when profit is low", () => {
    const r = computeDeclaration(
      base({
        taxType: "isb",
        caHt: 10_000_000,
        expenses: 9_900_000,
        activity: "commerce",
        yearCreated: 2020,
      }),
    );
    // ISB 30% of 100_000 = 30_000 → 30_000 ; IMF 1.5% of 10M = 150_000
    assert.equal(r.taxDue, 150_000);
  });
  it("exempts IMF for a company in its first two years", () => {
    const r = computeDeclaration(
      base({
        taxType: "isb",
        caHt: 10_000_000,
        expenses: 9_900_000,
        activity: "commerce",
        yearCreated: 2026,
        asOfDate: "2026-09-06",
      }),
    );
    assert.equal(r.taxDue, 30_000);
  });
});

describe("impôt synthétique", () => {
  it("applies commerce rate on TTC", () => {
    const r = computeDeclaration(
      base({
        taxType: "synthetique",
        regime: "synthetique",
        legalForm: "ei",
        activity: "commerce",
        caTtc: 5_000_000,
        caHt: 5_000_000,
      }),
    );
    assert.equal(r.taxDue, 150_000);
  });
  it("applies the indicative minimum above zero CA", () => {
    const r = computeDeclaration(
      base({
        taxType: "synthetique",
        regime: "synthetique",
        legalForm: "ei",
        activity: "commerce",
        caTtc: 100_000,
      }),
    );
    assert.equal(r.taxDue, DEFAULT_RATES.synthetiqueMin);
  });
  it("does not apply the minimum when CA is zero", () => {
    const r = computeDeclaration(
      base({
        taxType: "synthetique",
        regime: "synthetique",
        legalForm: "ei",
        caTtc: 0,
      }),
    );
    assert.equal(r.taxDue, 0);
  });
});

describe("penalties", () => {
  it("adds 5% within 30 days", () => {
    const r = computeDeclaration(
      base({
        taxType: "tva",
        caHt: 1_000_000,
        dueDate: "2026-08-15",
        asOfDate: "2026-08-25",
      }),
    );
    assert.equal(r.taxDue, 190_000);
    assert.equal(r.penalty, 9_500);
  });
  it("adds 10% between 31 and 90 days", () => {
    const r = computeDeclaration(
      base({
        taxType: "tva",
        caHt: 1_000_000,
        dueDate: "2026-06-15",
        asOfDate: "2026-08-01",
      }),
    );
    assert.equal(r.penalty, 19_000);
  });
});
