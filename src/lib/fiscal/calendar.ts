import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { Deadline, Regime, TaxType } from "./types";

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function labelMonth(d: Date): string {
  return format(d, "MMMM yyyy", { locale: fr });
}

function statusOf(due: Date, now: Date): Deadline["status"] {
  if (isBefore(due, startOfDay(now))) return "en_retard";
  if (!isAfter(due, addDays(now, 7))) return "cette_semaine";
  return "a_venir";
}

function item(
  taxType: TaxType,
  label: string,
  periodStart: Date,
  periodEnd: Date,
  due: Date,
  now: Date,
): Deadline {
  const daysLeft = Math.ceil((due.getTime() - startOfDay(now).getTime()) / 86_400_000);
  return {
    taxType,
    label,
    periodLabel: `${format(periodStart, "d MMM", { locale: fr })} – ${format(periodEnd, "d MMM yyyy", { locale: fr })}`,
    periodStart: iso(periodStart),
    periodEnd: iso(periodEnd),
    dueDate: iso(due),
    daysLeft,
    status: statusOf(due, now),
  };
}

function monthlyTva(now: Date, count: number): Deadline[] {
  const out: Deadline[] = [];
  for (let i = -2; i < count; i += 1) {
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + i, 0);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    const due = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 15);
    out.push(
      item("tva", `TVA ${labelMonth(periodStart)}`, periodStart, periodEnd, due, now),
    );
  }
  return out;
}

function quarterly(now: Date, taxType: TaxType, title: string, count: number): Deadline[] {
  const out: Deadline[] = [];
  const q = Math.floor(now.getMonth() / 3);
  for (let i = -1; i < count; i += 1) {
    const idx = q + i;
    const year = now.getFullYear() + Math.floor(idx / 4);
    const qi = ((idx % 4) + 4) % 4;
    const periodStart = new Date(year, qi * 3, 1);
    const periodEnd = new Date(year, qi * 3 + 3, 0);
    const due = new Date(year, qi * 3 + 3, 15);
    out.push(
      item(
        taxType,
        `${title} T${qi + 1} ${year}`,
        periodStart,
        periodEnd,
        due,
        now,
      ),
    );
  }
  return out;
}

function annualIsb(now: Date): Deadline[] {
  const thisYearDue = new Date(now.getFullYear(), 3, 30);
  const prevStart = new Date(now.getFullYear() - 1, 0, 1);
  const prevEnd = new Date(now.getFullYear() - 1, 11, 31);
  const nextDue = new Date(now.getFullYear() + 1, 3, 30);
  const nextStart = new Date(now.getFullYear(), 0, 1);
  const nextEnd = new Date(now.getFullYear(), 11, 31);
  return [
    item("isb", `ISB exercice ${now.getFullYear() - 1}`, prevStart, prevEnd, thisYearDue, now),
    item("isb", `ISB exercice ${now.getFullYear()}`, nextStart, nextEnd, nextDue, now),
  ];
}

export function fiscalDeadlines(regime: Regime, now = new Date()): Deadline[] {
  const list: Deadline[] = [];
  if (regime === "reel_normal") {
    list.push(...monthlyTva(now, 4));
    list.push(...annualIsb(now));
  } else if (regime === "reel_simplifie") {
    list.push(...quarterly(now, "tva", "TVA", 3));
    list.push(...annualIsb(now));
  } else {
    list.push(...quarterly(now, "synthetique", "Impôt synthétique", 3));
  }
  list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return list;
}

export function upcomingDeadlines(regime: Regime, now = new Date(), limit = 6): Deadline[] {
  const all = fiscalDeadlines(regime, now);
  const horizon = addDays(now, 180);
  return all
    .filter((d) => {
      const due = parseISO(d.dueDate);
      return d.status === "en_retard" || !isAfter(due, horizon);
    })
    .slice(0, limit);
}

export function formatDue(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMMM yyyy", { locale: fr });
  } catch {
    return isoDate;
  }
}
