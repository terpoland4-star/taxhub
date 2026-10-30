/**
 * Minimal .env loader — parses KEY=VALUE lines directly in JS, with no
 * dependency on the shell sourcing the file (unlike `set -a; source .env`).
 * Existing `process.env` entries always win, so an explicit export or a
 * PM2-injected value still overrides the file — same precedence rule as
 * `with-app-env.mjs`.
 */
import { readFileSync } from "node:fs";

/** Strip one layer of matching single/double quotes, if present. */
function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Load `path` (a .env file) into process.env. Silently no-ops if missing. */
export function loadEnvFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    if (process.env[key] !== undefined) continue; // explicit env always wins
    process.env[key] = unquote(line.slice(eq + 1));
  }
}
