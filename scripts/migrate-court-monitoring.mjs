/**
 * Applies supabase/court_monitoring.sql using POSTGRES_URL from .env.local
 * Usage: node scripts/migrate-court-monitoring.mjs
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

  const host = process.env.POSTGRES_HOST;
  const password = process.env.POSTGRES_PASSWORD;
  const user = process.env.POSTGRES_USER ?? "postgres";
  const database = process.env.POSTGRES_DATABASE ?? "postgres";
  if (host && password && !password.includes("SENSITIVE")) {
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:5432/${database}`;
  }

  return null;
}

const sql = readFileSync(resolve(root, "supabase/court_monitoring.sql"), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .trim();

loadEnvLocal();
const connectionString = getConnectionString();

if (!connectionString) {
  console.error(
    "Cannot connect to database. Add POSTGRES_URL or POSTGRES_PASSWORD to .env.local.",
  );
  console.error("Get it from: Supabase Dashboard → Project Settings → Database → Connection string");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);

  const { rows } = await client.query(`
    select
      to_regclass('public.court_availability_snapshots') as snapshots,
      to_regclass('public.court_alert_events') as events
  `);

  const { snapshots, events } = rows[0] ?? {};
  if (snapshots && events) {
    console.log("Done! Created monitoring tables:");
    console.log("  - court_availability_snapshots");
    console.log("  - court_alert_events");
  } else {
    console.error("Migration ran but tables were not found.");
    process.exit(1);
  }
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
} finally {
  await client.end();
}
