import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessReadiness } from "./fonap.ts";

const company = {
  nif: "N000123456P",
  rccm: "NE-NIM-2021-A-1234",
  secef_mode: "e_secef",
  phone: "+227 90 00 00 00",
  email: "contact@sahel.ne",
};

describe("assessReadiness", () => {
  it("scores a complete, up-to-date company 100/100", () => {
    const r = assessReadiness({
      company,
      declarations: [{ status: "payee", due_date: "2026-07-15", submitted_at: "2026-07-10" }],
      asOfDate: "2026-10-30",
    });
    assert.equal(r.score, 100);
    assert.equal(r.level, "pret");
  });

  it("flags an unpaid declaration past its due date as overdue", () => {
    const r = assessReadiness({
      company,
      declarations: [
        { status: "payee", due_date: "2026-07-15", submitted_at: "2026-07-10" },
        { status: "calculee", due_date: "2026-09-15", submitted_at: null },
      ],
      asOfDate: "2026-10-30",
    });
    assert.equal(r.checks.find((c) => c.code === "a_jour")?.ok, false);
    assert.equal(r.score, 80);
  });

  it("ignores filings older than twelve months for the history check", () => {
    const r = assessReadiness({
      company,
      declarations: [{ status: "payee", due_date: "2025-06-15", submitted_at: "2025-06-10" }],
      asOfDate: "2026-10-30",
    });
    assert.equal(r.checks.find((c) => c.code === "historique")?.ok, false);
  });

  it("gives no identity points without a company", () => {
    const r = assessReadiness({ company: null, declarations: [], asOfDate: "2026-10-30" });
    assert.equal(r.score, 20);
    assert.equal(r.level, "a_construire");
  });
});
