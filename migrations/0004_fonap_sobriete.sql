-- FONAP / DIGI-PME readiness: the two identifiers the FONAP calls require
-- (RCCM next to the NIF) and how the company certifies its invoices (SECeF).
alter table companies add column if not exists rccm text not null default '';
alter table companies add column if not exists secef_mode text not null default 'aucun';

-- LF 2026 / nouveau CGI (ord. n°2025-22, applicable au 1er janvier 2026) :
-- le FMI (rapport n°26/74) signale la suppression d'exonérations et le
-- relèvement de taux réduits au taux normal de 19 %. Les lignes restent non
-- validées jusqu'à la Phase Z.
update tax_rates
set notes = 'LF 2026 : plusieurs taux réduits relevés à 19 % (FMI, rapport n°26/74). Vérifier produit par produit avant usage.'
where code in ('tva_reduced_10', 'tva_reduced_5');
