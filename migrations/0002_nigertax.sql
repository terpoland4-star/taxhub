-- NigerTax Pro schema. Tax amounts live in numeric columns; rates are versioned
-- rows (never hardcoded in application logic at query time).

create table if not exists profiles (
  user_id text primary key,
  full_name text not null default '',
  account_type text not null default 'pme',
  phone text not null default '',
  active_company_id text,
  created_at timestamptz not null default now()
);

create table if not exists cabinets (
  id text primary key,
  owner_user_id text not null,
  name text not null,
  logo_initials text not null default 'NT',
  accent_color text not null default '#1F6B4A',
  created_at timestamptz not null default now()
);
create index if not exists cabinets_owner_idx on cabinets (owner_user_id);

create table if not exists companies (
  id text primary key,
  owner_user_id text not null,
  cabinet_id text,
  name text not null,
  nif text not null default '',
  legal_form text not null default 'ei',
  activity text not null default 'commerce',
  regime text not null default 'synthetique',
  city text not null default 'Niamey',
  phone text not null default '',
  email text not null default '',
  year_created integer,
  created_at timestamptz not null default now()
);
create index if not exists companies_owner_idx on companies (owner_user_id);
create index if not exists companies_cabinet_idx on companies (cabinet_id);

create table if not exists company_members (
  company_id text not null,
  user_id text not null,
  role text not null default 'admin',
  primary key (company_id, user_id)
);
create index if not exists company_members_user_idx on company_members (user_id);

create table if not exists tax_rates (
  id serial primary key,
  code text not null,
  label text not null,
  value_numeric numeric not null,
  unit text not null default 'percent',
  tax_type text not null,
  activity text,
  source text not null,
  effective_from date not null,
  effective_to date,
  validated boolean not null default false,
  notes text not null default ''
);
create index if not exists tax_rates_code_idx on tax_rates (code);

create table if not exists declarations (
  id text primary key,
  company_id text not null,
  user_id text not null,
  tax_type text not null,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  due_date date not null,
  status text not null default 'brouillon',
  ca_ht numeric not null default 0,
  ca_ttc numeric not null default 0,
  purchases_ht numeric not null default 0,
  tva_collected numeric not null default 0,
  tva_deductible numeric not null default 0,
  expenses numeric not null default 0,
  taxable_profit numeric not null default 0,
  tax_due numeric not null default 0,
  penalty numeric not null default 0,
  total_due numeric not null default 0,
  breakdown text not null default '{}',
  rates_snapshot text not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists declarations_company_idx on declarations (company_id);
create index if not exists declarations_user_idx on declarations (user_id);

create table if not exists payments (
  id text primary key,
  declaration_id text not null,
  company_id text not null,
  user_id text not null,
  provider text not null,
  amount numeric not null,
  status text not null default 'pending',
  reference text not null,
  phone text not null default '',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists payments_decl_idx on payments (declaration_id);
create index if not exists payments_user_idx on payments (user_id);

create table if not exists receipts (
  id text primary key,
  payment_id text not null,
  declaration_id text not null,
  company_id text not null,
  user_id text not null,
  reference text not null,
  amount numeric not null,
  tax_type text not null,
  company_name text not null,
  nif text not null,
  issued_at timestamptz not null default now()
);
create index if not exists receipts_user_idx on receipts (user_id);

create table if not exists reminders (
  id text primary key,
  company_id text not null,
  user_id text not null,
  tax_type text not null,
  due_date date not null,
  channel text not null default 'in_app',
  sent_at timestamptz,
  message text not null
);
create index if not exists reminders_user_idx on reminders (user_id);

-- Versioned indicative rates. validated = false until a fiscalist signs off (Phase Z).
insert into tax_rates (code, label, value_numeric, unit, tax_type, activity, source, effective_from, validated, notes)
values
  ('tva_standard', 'TVA taux normal', 0.19, 'percent', 'tva', null, 'CGI Niger art. 226 — taux normal ; ordonnance n°2025-22 du 14 juillet 2025', '2026-01-01', false, 'Taux public. Non certifié pour télédéclaration officielle.'),
  ('tva_reduced_10', 'TVA taux réduit 10 %', 0.10, 'percent', 'tva', null, 'Guide SFE / DGI — groupe C ; LF 2026 évoque un relèvement 5→10 % sur certains produits alimentaires (art. 336)', '2026-01-01', false, 'À confirmer produit par produit.'),
  ('tva_reduced_5', 'TVA taux réduit 5 %', 0.05, 'percent', 'tva', null, 'Guide SFE / DGI — groupe D ; FMI 2025 (taux réduit 5 % sur certains produits)', '2026-01-01', false, 'Certaines exonérations sociales (eau, électricité ménages) maintenues en 2026 selon DGI.'),
  ('tva_zero', 'TVA taux zéro / exonéré', 0, 'percent', 'tva', null, 'CGI / Guide SFE — groupes F, G ; produits pharmaceutiques, riz ordinaire, farines sorgho et maïs (service-public.ne)', '2026-01-01', false, ''),
  ('isb_rate', 'Impôt sur les bénéfices', 0.30, 'percent', 'isb', null, 'CGI Niger art. 27 — 30 % du bénéfice net, arrondi au millier de francs inférieur', '2026-01-01', false, 'Sans abattement.'),
  ('ifm_industry', 'IMF — entreprises industrielles', 0.01, 'percent', 'ifm', 'industrie', 'CGI — IMF assis sur le CA HT ; RAPPORT DGI 2022', '2026-01-01', false, 'Exonération des 2 premiers exercices pour entreprises nouvelles (sous condition de déclaration dans les délais).'),
  ('ifm_other', 'IMF — autres activités', 0.015, 'percent', 'ifm', 'autre', 'CGI — IMF 1,5 % ; LF 2026 évoque 1,75 % pour certaines activités (à valider)', '2026-01-01', false, 'Le moteur utilise 1,5 % en attendant validation du barème 2026.'),
  ('synthetique_commerce', 'Impôt synthétique — commerce', 0.03, 'percent', 'synthetique', 'commerce', 'Barème interne indicatif — à valider par fiscaliste (Phase 0 / Z)', '2026-01-01', false, 'Non issu d''un article CGI sourcé. Ne pas utiliser pour une déclaration officielle.'),
  ('synthetique_services', 'Impôt synthétique — services', 0.05, 'percent', 'synthetique', 'services', 'Barème interne indicatif — à valider par fiscaliste (Phase 0 / Z)', '2026-01-01', false, 'Non issu d''un article CGI sourcé.'),
  ('synthetique_mixte', 'Impôt synthétique — mixte', 0.04, 'percent', 'synthetique', 'mixte', 'Barème interne indicatif — à valider par fiscaliste (Phase 0 / Z)', '2026-01-01', false, 'Non issu d''un article CGI sourcé.'),
  ('synthetique_min', 'Minimum impôt synthétique', 25000, 'amount', 'synthetique', null, 'Plancher indicatif interne — à valider', '2026-01-01', false, ''),
  ('threshold_synthetique', 'Seuil impôt synthétique (CA TTC)', 50000000, 'amount', 'threshold', null, 'impots.gouv.ne — régime de l''impôt synthétique : CA TTC < 50 millions FCFA (entreprises individuelles)', '2026-01-01', false, ''),
  ('threshold_reel_simplifie', 'Seuil régime réel simplifié (CA HT)', 50000000, 'amount', 'threshold', null, 'impots.gouv.ne — réel simplifié : CA HT entre 50 et 100 millions FCFA', '2026-01-01', false, ''),
  ('threshold_reel_normal', 'Seuil régime réel normal (CA HT)', 100000000, 'amount', 'threshold', null, 'impots.gouv.ne — réel normal de plein droit si CA HT > 100 millions, sociétés, professions libérales', '2026-01-01', false, ''),
  ('penalty_30', 'Majoration 1–30 jours de retard', 0.05, 'percent', 'penalty', null, 'Barème de retard indicatif (pratique régionale) — à valider CGI Niger', '2026-01-01', false, ''),
  ('penalty_90', 'Majoration 31–90 jours de retard', 0.10, 'percent', 'penalty', null, 'Barème de retard indicatif — à valider CGI Niger', '2026-01-01', false, ''),
  ('penalty_late', 'Majoration au-delà de 90 jours', 0.15, 'percent', 'penalty', null, 'Barème de retard indicatif — à valider CGI Niger', '2026-01-01', false, ''),
  ('interest_monthly', 'Intérêts de retard mensuels', 0.01, 'percent', 'penalty', null, 'Barème de retard indicatif — à valider CGI Niger', '2026-01-01', false, 'Calculé au prorata du nombre de mois entamés.');
