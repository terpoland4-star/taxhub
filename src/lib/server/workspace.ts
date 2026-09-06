import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { upcomingDeadlines } from "@/lib/fiscal/calendar";
import { computeDeclaration, ratesFromRows } from "@/lib/fiscal/engine";
import { DEFAULT_RATES, type Activity, type LegalForm, type Regime, type TaxType } from "@/lib/fiscal/types";
import { nid, num, paymentRef } from "./ids";

type ProfileRow = {
  user_id: string;
  full_name: string;
  account_type: string;
  phone: string;
  active_company_id: string | null;
};

type CompanyRow = {
  id: string;
  owner_user_id: string;
  cabinet_id: string | null;
  name: string;
  nif: string;
  legal_form: string;
  activity: string;
  regime: string;
  city: string;
  phone: string;
  email: string;
  year_created: number | null;
};

type CabinetRow = {
  id: string;
  owner_user_id: string;
  name: string;
  logo_initials: string;
  accent_color: string;
};

type DeclRow = {
  id: string;
  company_id: string;
  user_id: string;
  tax_type: string;
  period_label: string;
  period_start: string;
  period_end: string;
  due_date: string;
  status: string;
  ca_ht: string | number;
  ca_ttc: string | number;
  purchases_ht: string | number;
  tva_collected: string | number;
  tva_deductible: string | number;
  expenses: string | number;
  taxable_profit: string | number;
  tax_due: string | number;
  penalty: string | number;
  total_due: string | number;
  breakdown: string;
  rates_snapshot: string;
  submitted_at: string | null;
  created_at: string;
};

type PayRow = {
  id: string;
  declaration_id: string;
  company_id: string;
  user_id: string;
  provider: string;
  amount: string | number;
  status: string;
  reference: string;
  phone: string;
  created_at: string;
  confirmed_at: string | null;
};

type ReceiptRow = {
  id: string;
  payment_id: string;
  declaration_id: string;
  company_id: string;
  user_id: string;
  reference: string;
  amount: string | number;
  tax_type: string;
  company_name: string;
  nif: string;
  issued_at: string;
};

type ReminderRow = {
  id: string;
  company_id: string;
  user_id: string;
  tax_type: string;
  due_date: string;
  channel: string;
  sent_at: string | null;
  message: string;
};

type RateRow = {
  id: number;
  code: string;
  label: string;
  value_numeric: string | number;
  unit: string;
  tax_type: string;
  activity: string | null;
  source: string;
  effective_from: string;
  effective_to: string | null;
  validated: boolean;
  notes: string;
};

async function accessibleCompanyIds(userId: string): Promise<string[]> {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select c.id
    from companies c
    left join company_members m on m.company_id = c.id
    left join cabinets cab on cab.id = c.cabinet_id
    where c.owner_user_id = ${userId}
       or m.user_id = ${userId}
       or cab.owner_user_id = ${userId}
  `;
  return [...new Set(rows.map((r) => r.id))];
}

async function ensureWorkspace(userId: string, displayName: string | null, email: string | null) {
  const sql = await getSql();
  const existing = await sql<ProfileRow>`select * from profiles where user_id = ${userId} limit 1`;
  if (existing[0]) return existing[0];

  const companyId = nid("co");
  await sql`
    insert into profiles (user_id, full_name, account_type, phone, active_company_id)
    values (${userId}, ${displayName ?? ""}, 'pme', '', ${companyId})
  `;
  await sql`
    insert into companies (id, owner_user_id, name, nif, legal_form, activity, regime, city, email, year_created)
    values (
      ${companyId}, ${userId}, ${displayName ? `${displayName}` : "Mon entreprise"},
      '', 'ei', 'commerce', 'synthetique', 'Niamey', ${email ?? ""}, ${new Date().getFullYear()}
    )
  `;
  await sql`
    insert into company_members (company_id, user_id, role)
    values (${companyId}, ${userId}, 'admin')
  `;
  const created = await sql<ProfileRow>`select * from profiles where user_id = ${userId} limit 1`;
  return created[0];
}

async function loadRates() {
  const sql = await getSql();
  const rows = await sql<RateRow>`select * from tax_rates order by id`;
  return { rows, table: ratesFromRows(rows) };
}

export const getPublicRates = createServerFn({ method: "GET" }).handler(async () => {
  const { rows, table } = await loadRates();
  return { rows, table };
});

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await ensureWorkspace(context.userId, null, null);

    const companies = await sql<CompanyRow>`
      select distinct c.id, c.owner_user_id, c.cabinet_id, c.name, c.nif, c.legal_form,
             c.activity, c.regime, c.city, c.phone, c.email, c.year_created
      from companies c
      left join company_members m on m.company_id = c.id
      left join cabinets cab on cab.id = c.cabinet_id
      where c.owner_user_id = ${context.userId}
         or m.user_id = ${context.userId}
         or cab.owner_user_id = ${context.userId}
      order by c.name asc
    `;

    const cabinets = await sql<CabinetRow>`
      select * from cabinets where owner_user_id = ${context.userId}
    `;

    let activeId = profile.active_company_id;
    if (!activeId || !companies.some((c) => c.id === activeId)) {
      activeId = companies[0]?.id ?? null;
      if (activeId) {
        await sql`update profiles set active_company_id = ${activeId} where user_id = ${context.userId}`;
      }
    }

    const declarations = await sql<DeclRow>`
      select d.* from declarations d
      where d.company_id in (
        select c.id from companies c
        where c.owner_user_id = ${context.userId}
           or c.cabinet_id in (select id from cabinets where owner_user_id = ${context.userId})
           or c.id in (select company_id from company_members where user_id = ${context.userId})
      )
      order by d.created_at desc
    `;
    const payments = await sql<PayRow>`
      select p.* from payments p
      where p.company_id in (
        select c.id from companies c
        where c.owner_user_id = ${context.userId}
           or c.cabinet_id in (select id from cabinets where owner_user_id = ${context.userId})
           or c.id in (select company_id from company_members where user_id = ${context.userId})
      )
      order by p.created_at desc
    `;
    const receipts = await sql<ReceiptRow>`
      select r.* from receipts r
      where r.company_id in (
        select c.id from companies c
        where c.owner_user_id = ${context.userId}
           or c.cabinet_id in (select id from cabinets where owner_user_id = ${context.userId})
           or c.id in (select company_id from company_members where user_id = ${context.userId})
      )
      order by r.issued_at desc
    `;
    const reminders = await sql<ReminderRow>`
      select rem.* from reminders rem
      where rem.company_id in (
        select c.id from companies c
        where c.owner_user_id = ${context.userId}
           or c.cabinet_id in (select id from cabinets where owner_user_id = ${context.userId})
           or c.id in (select company_id from company_members where user_id = ${context.userId})
      )
      order by rem.due_date asc
    `;

    const { rows: rates, table } = await loadRates();
    const active = companies.find((c) => c.id === activeId) ?? null;
    const deadlines = upcomingDeadlines((active?.regime as Regime) ?? "synthetique");

    return {
      profile: { ...profile, active_company_id: activeId },
      companies,
      cabinets,
      activeCompany: active,
      declarations: declarations.map(mapDecl),
      payments: payments.map(mapPay),
      receipts: receipts.map(mapReceipt),
      reminders,
      rates,
      rateTable: table,
      deadlines,
    };
  });

function mapDecl(d: DeclRow) {
  return {
    ...d,
    ca_ht: num(d.ca_ht),
    ca_ttc: num(d.ca_ttc),
    purchases_ht: num(d.purchases_ht),
    tva_collected: num(d.tva_collected),
    tva_deductible: num(d.tva_deductible),
    expenses: num(d.expenses),
    taxable_profit: num(d.taxable_profit),
    tax_due: num(d.tax_due),
    penalty: num(d.penalty),
    total_due: num(d.total_due),
  };
}

function mapPay(p: PayRow) {
  return { ...p, amount: num(p.amount) };
}

function mapReceipt(r: ReceiptRow) {
  return { ...r, amount: num(r.amount) };
}

export const setActiveCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const ids = await accessibleCompanyIds(context.userId);
    if (!ids.includes(id)) throw new Error("Entreprise introuvable");
    const sql = await getSql();
    await sql`update profiles set active_company_id = ${id} where user_id = ${context.userId}`;
    return { ok: true };
  });

export const upsertCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id?: string;
      name: string;
      nif: string;
      legalForm: LegalForm;
      activity: Activity;
      regime: Regime;
      city: string;
      phone: string;
      email: string;
      yearCreated: number | null;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      const ids = await accessibleCompanyIds(context.userId);
      if (!ids.includes(data.id)) throw new Error("Entreprise introuvable");
      await sql`
        update companies set
          name = ${data.name.trim() || "Entreprise"},
          nif = ${data.nif.trim()},
          legal_form = ${data.legalForm},
          activity = ${data.activity},
          regime = ${data.regime},
          city = ${data.city.trim() || "Niamey"},
          phone = ${data.phone.trim()},
          email = ${data.email.trim()},
          year_created = ${data.yearCreated}
        where id = ${data.id}
      `;
      return { id: data.id };
    }
    const id = nid("co");
    const profile = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    const cabinet = await sql<CabinetRow>`select * from cabinets where owner_user_id = ${context.userId} limit 1`;
    await sql`
      insert into companies (id, owner_user_id, cabinet_id, name, nif, legal_form, activity, regime, city, phone, email, year_created)
      values (
        ${id}, ${context.userId}, ${cabinet[0]?.id ?? null}, ${data.name.trim() || "Entreprise"},
        ${data.nif.trim()}, ${data.legalForm}, ${data.activity}, ${data.regime},
        ${data.city.trim() || "Niamey"}, ${data.phone.trim()}, ${data.email.trim()}, ${data.yearCreated}
      )
    `;
    await sql`insert into company_members (company_id, user_id, role) values (${id}, ${context.userId}, 'admin')`;
    if (profile[0]?.account_type === "pme" && !profile[0].active_company_id) {
      await sql`update profiles set active_company_id = ${id} where user_id = ${context.userId}`;
    }
    return { id };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { fullName: string; phone: string; accountType: "pme" | "cabinet"; cabinetName?: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update profiles
      set full_name = ${data.fullName.trim()},
          phone = ${data.phone.trim()},
          account_type = ${data.accountType}
      where user_id = ${context.userId}
    `;
    if (data.accountType === "cabinet") {
      const existing = await sql<CabinetRow>`select * from cabinets where owner_user_id = ${context.userId} limit 1`;
      if (!existing[0]) {
        const id = nid("cab");
        const name = data.cabinetName?.trim() || "Cabinet";
        const initials = name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("");
        await sql`
          insert into cabinets (id, owner_user_id, name, logo_initials)
          values (${id}, ${context.userId}, ${name}, ${initials || "CB"})
        `;
        await sql`update companies set cabinet_id = ${id} where owner_user_id = ${context.userId}`;
      } else if (data.cabinetName?.trim()) {
        await sql`update cabinets set name = ${data.cabinetName.trim()} where id = ${existing[0].id}`;
      }
    }
    return { ok: true };
  });

export const saveCabinetBrand = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { name: string; initials: string; accent: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const cab = await sql<CabinetRow>`select * from cabinets where owner_user_id = ${context.userId} limit 1`;
    if (!cab[0]) throw new Error("Aucun cabinet");
    await sql`
      update cabinets
      set name = ${data.name.trim() || cab[0].name},
          logo_initials = ${data.initials.trim().slice(0, 3).toUpperCase() || "NT"},
          accent_color = ${/^#[0-9A-Fa-f]{6}$/.test(data.accent) ? data.accent : cab[0].accent_color}
      where id = ${cab[0].id} and owner_user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const simulateTax = createServerFn({ method: "POST" })
  .validator(
    (d: {
      taxType: TaxType;
      regime: Regime;
      activity: Activity;
      legalForm: LegalForm;
      yearCreated?: number | null;
      caHt: number;
      caTtc: number;
      purchasesHt: number;
      expenses: number;
      dueDate: string;
      asOfDate?: string;
      salesTvaRate?: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { table } = await loadRates();
    return computeDeclaration(data, table);
  });

export const saveDeclaration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      companyId: string;
      taxType: TaxType;
      periodLabel: string;
      periodStart: string;
      periodEnd: string;
      dueDate: string;
      caHt: number;
      caTtc: number;
      purchasesHt: number;
      expenses: number;
      salesTvaRate?: number;
      submit?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const ids = await accessibleCompanyIds(context.userId);
    if (!ids.includes(data.companyId)) throw new Error("Entreprise introuvable");
    const sql = await getSql();
    const company = (await sql<CompanyRow>`select * from companies where id = ${data.companyId}`)[0];
    if (!company) throw new Error("Entreprise introuvable");
    const { table } = await loadRates();
    const result = computeDeclaration(
      {
        taxType: data.taxType,
        regime: company.regime as Regime,
        activity: company.activity as Activity,
        legalForm: company.legal_form as LegalForm,
        yearCreated: company.year_created,
        caHt: data.caHt,
        caTtc: data.caTtc,
        purchasesHt: data.purchasesHt,
        expenses: data.expenses,
        dueDate: data.dueDate,
        salesTvaRate: data.salesTvaRate,
      },
      table,
    );
    const today = new Date().toISOString().slice(0, 10);
    const late = data.dueDate < today && result.totalDue > 0;
    const status = data.submit ? (late ? "en_retard" : "soumise") : "calculee";
    const id = nid("dec");
    await sql`
      insert into declarations (
        id, company_id, user_id, tax_type, period_label, period_start, period_end, due_date, status,
        ca_ht, ca_ttc, purchases_ht, expenses, tax_due, penalty, total_due, breakdown, rates_snapshot, submitted_at
      ) values (
        ${id}, ${data.companyId}, ${context.userId}, ${data.taxType}, ${data.periodLabel},
        ${data.periodStart}, ${data.periodEnd}, ${data.dueDate}, ${status},
        ${data.caHt}, ${data.caTtc}, ${data.purchasesHt}, ${data.expenses},
        ${result.taxDue}, ${result.penalty + result.interest}, ${result.totalDue},
        ${JSON.stringify(result)}, ${JSON.stringify(table)},
        ${data.submit ? new Date().toISOString() : null}
      )
    `;
    return { id, result, status };
  });

export const startPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { declarationId: string; provider: "airtel" | "moov" | "card"; phone: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const decl = (
      await sql<DeclRow>`
        select * from declarations where id = ${data.declarationId} and user_id = ${context.userId} limit 1
      `
    )[0];
    if (!decl) throw new Error("Déclaration introuvable");
    if (decl.status === "payee") throw new Error("Déjà payée");
    const id = nid("pay");
    const reference = paymentRef();
    await sql`
      insert into payments (id, declaration_id, company_id, user_id, provider, amount, status, reference, phone)
      values (${id}, ${decl.id}, ${decl.company_id}, ${context.userId}, ${data.provider}, ${num(decl.total_due)}, 'pending', ${reference}, ${data.phone})
    `;
    return { id, reference, amount: num(decl.total_due) };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { paymentId: string; outcome: "confirmed" | "failed" | "timeout" }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const pay = (
      await sql<PayRow>`select * from payments where id = ${data.paymentId} and user_id = ${context.userId} limit 1`
    )[0];
    if (!pay) throw new Error("Paiement introuvable");
    const now = new Date().toISOString();
    await sql`update payments set status = ${data.outcome}, confirmed_at = ${data.outcome === "confirmed" ? now : null} where id = ${pay.id} and user_id = ${context.userId}`;
    if (data.outcome !== "confirmed") return { receiptId: null };

    await sql`update declarations set status = 'payee' where id = ${pay.declaration_id} and user_id = ${context.userId}`;
    const decl = (await sql<DeclRow>`select * from declarations where id = ${pay.declaration_id}`)[0];
    const company = (await sql<CompanyRow>`select * from companies where id = ${pay.company_id}`)[0];
    const receiptId = nid("rc");
    await sql`
      insert into receipts (id, payment_id, declaration_id, company_id, user_id, reference, amount, tax_type, company_name, nif)
      values (
        ${receiptId}, ${pay.id}, ${pay.declaration_id}, ${pay.company_id}, ${context.userId},
        ${pay.reference}, ${pay.amount}, ${decl?.tax_type ?? "tva"}, ${company?.name ?? "Entreprise"}, ${company?.nif ?? ""}
      )
    `;
    return { receiptId, reference: pay.reference };
  });

export const sendReminder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { companyId: string; taxType: TaxType; dueDate: string; channel: "in_app" | "email" | "sms"; message: string }) => d)
  .handler(async ({ context, data }) => {
    const ids = await accessibleCompanyIds(context.userId);
    if (!ids.includes(data.companyId)) throw new Error("Entreprise introuvable");
    const sql = await getSql();
    const id = nid("rem");
    await sql`
      insert into reminders (id, company_id, user_id, tax_type, due_date, channel, sent_at, message)
      values (${id}, ${data.companyId}, ${context.userId}, ${data.taxType}, ${data.dueDate}, ${data.channel}, ${new Date().toISOString()}, ${data.message})
    `;
    return { id };
  });

export const seedDemo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = (await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`)[0];
    const companyId = profile?.active_company_id;
    if (!companyId) throw new Error("Aucune entreprise");
    const ids = await accessibleCompanyIds(context.userId);
    if (!ids.includes(companyId)) throw new Error("Entreprise introuvable");
    const company = (await sql<CompanyRow>`select * from companies where id = ${companyId}`)[0];
    const { table } = await loadRates();

    const specs = [
      {
        taxType: "synthetique" as TaxType,
        label: "T2 2026",
        start: "2026-04-01",
        end: "2026-06-30",
        due: "2026-07-15",
        ca: 8_400_000,
        status: "payee",
      },
      {
        taxType: "synthetique" as TaxType,
        label: "T3 2026",
        start: "2026-07-01",
        end: "2026-09-30",
        due: "2026-10-15",
        ca: 6_200_000,
        status: "soumise",
      },
      {
        taxType: "tva" as TaxType,
        label: "Août 2026",
        start: "2026-08-01",
        end: "2026-08-31",
        due: "2026-09-15",
        ca: 3_500_000,
        status: "calculee",
      },
    ];

    for (const spec of specs) {
      const result = computeDeclaration(
        {
          taxType: spec.taxType,
          regime: company.regime as Regime,
          activity: company.activity as Activity,
          legalForm: company.legal_form as LegalForm,
          yearCreated: company.year_created,
          caHt: spec.ca,
          caTtc: spec.ca,
          purchasesHt: spec.ca * 0.4,
          expenses: spec.ca * 0.55,
          dueDate: spec.due,
          asOfDate: "2026-09-06",
        },
        table,
      );
      const id = nid("dec");
      await sql`
        insert into declarations (
          id, company_id, user_id, tax_type, period_label, period_start, period_end, due_date, status,
          ca_ht, ca_ttc, purchases_ht, expenses, tax_due, penalty, total_due, breakdown, rates_snapshot, submitted_at
        ) values (
          ${id}, ${companyId}, ${context.userId}, ${spec.taxType}, ${spec.label},
          ${spec.start}, ${spec.end}, ${spec.due}, ${spec.status},
          ${spec.ca}, ${spec.ca}, ${spec.ca * 0.4}, ${spec.ca * 0.55},
          ${result.taxDue}, ${result.penalty + result.interest}, ${result.totalDue},
          ${JSON.stringify(result)}, ${JSON.stringify(table)},
          ${spec.status === "payee" || spec.status === "soumise" ? "2026-07-10T10:00:00.000Z" : null}
        )
      `;
      if (spec.status === "payee") {
        const payId = nid("pay");
        const reference = paymentRef();
        await sql`
          insert into payments (id, declaration_id, company_id, user_id, provider, amount, status, reference, phone, confirmed_at)
          values (${payId}, ${id}, ${companyId}, ${context.userId}, 'airtel', ${result.totalDue}, 'confirmed', ${reference}, '90 12 34 56', '2026-07-12T09:00:00.000Z')
        `;
        await sql`
          insert into receipts (id, payment_id, declaration_id, company_id, user_id, reference, amount, tax_type, company_name, nif, issued_at)
          values (${nid("rc")}, ${payId}, ${id}, ${companyId}, ${context.userId}, ${reference}, ${result.totalDue}, ${spec.taxType}, ${company.name}, ${company.nif}, '2026-07-12T09:00:00.000Z')
        `;
      }
    }
    await sql`
      update companies set name = 'Sahel Négoce', nif = 'N000123456P', city = 'Niamey', activity = 'commerce', regime = 'synthetique'
      where id = ${companyId}
    `;
    return { ok: true };
  });
