-- Schéma du plugin Better Auth two-factor (TOTP).
--
-- Ajoute "twoFactorEnabled" à "user" et une table "twoFactor" qui stocke le
-- secret TOTP + les codes de secours par utilisateur. Les noms de champs
-- correspondent exactement au schema.mjs du plugin plugins/two-factor
-- (adaptateur Postgres, camelCase, colonnes entre guillemets) — ne pas
-- renommer, le plugin interroge par ces noms précis.

alter table "user" add column if not exists "twoFactorEnabled" boolean not null default false;

create table if not exists "twoFactor" (
  "id" text not null primary key,
  "secret" text not null,
  "backupCodes" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "verified" boolean not null default true,
  "failedVerificationCount" integer not null default 0,
  "lockedUntil" timestamptz
);

create index if not exists "twoFactor_userId_idx" on "twoFactor" ("userId");
create index if not exists "twoFactor_secret_idx" on "twoFactor" ("secret");
