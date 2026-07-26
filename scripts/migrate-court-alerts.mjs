/**
 * Applies supabase/court_alerts.sql using POSTGRES_URL from .env.local
 * Usage: node scripts/migrate-court-alerts.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function getConnectionString() {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  ];
  for (const url of candidates) {
    if (url && !url.includes("SENSITIVE")) return url;
  }
  return null;
}

const sql = readFileSync(resolve(root, "supabase/court_alerts.sql"), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .trim();

loadEnvLocal();
const connectionString = getConnectionString();

if (!connectionString) {
  console.error(
    "Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING in .env.local (must not be [SENSITIVE]).",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "select to_regclass('public.court_alerts') as table_name",
  );
  if (rows[0]?.table_name) {
    console.log("Migration complete: public.court_alerts exists.");
  } else {
    console.error("Migration ran but court_alerts table was not found.");
    process.exit(1);
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("already exists")) {
    console.log("Migration skipped: public.court_alerts already exists.");
    process.exit(0);
  }
  console.error("Migration failed:", message);
  process.exit(1);
} finally {
  await client.end();
}
