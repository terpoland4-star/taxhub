import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeImpact, projectNational } from "./sobriete.ts";

describe("computeImpact", () => {
  it("counts sheets and trips for one filed and paid declaration", () => {
    const r = computeImpact({ declarations: 1, payments: 1, receipts: 1 });
    assert.equal(r.sheets, 7);
    assert.equal(r.trips, 2);
    assert.equal(r.fuelLitres, 0.6);
    assert.equal(r.hoursSaved, 4);
  });

  it("is zero with no activity", () => {
    assert.deepEqual(computeImpact({ declarations: 0, payments: 0, receipts: 0 }), {
      sheets: 0,
      trips: 0,
      fuelLitres: 0,
      kgCo2: 0,
      hoursSaved: 0,
    });
  });
});

describe("projectNational", () => {
  it("scales per-taxpayer impact to the whole base", () => {
    const r = projectNational(1000, 12);
    assert.equal(r.sheets, 84_000);
    assert.equal(r.reams, 168);
    assert.equal(r.trips, 24_000);
  });
});
