import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("[SENSITIVE]")) {
  console.error(
    "Set POSTGRES_URL_NON_POOLING (or POSTGRES_URL) in .env.local with your Supabase direct connection string.",
  );
  process.exit(1);
}

const files = [
  "supabase/tournaments.sql",
  "supabase/events.sql",
  "supabase/event-submissions.sql",
  "supabase/discovery.sql",
];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const relative of files) {
    const filePath = path.join(root, relative);
    console.log(`Applying ${relative}...`);
    const sql = fs.readFileSync(filePath, "utf8");
    await client.query(sql);
    console.log(`OK ${relative}`);
  }
  console.log("Schema apply finished.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
