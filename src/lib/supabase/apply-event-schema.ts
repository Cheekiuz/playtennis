import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const SCHEMA_FILES = [
  "supabase/tournaments.sql",
  "supabase/events.sql",
  "supabase/event-submissions.sql",
  "supabase/discovery.sql",
  "supabase/source-registry.sql",
];

function connectionString(): string {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
  if (direct && !direct.includes("[SENSITIVE]")) return direct;

  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USER ?? "postgres";
  const database = process.env.POSTGRES_DATABASE ?? "postgres";
  if (password && host && !password.includes("[SENSITIVE]")) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/${database}?sslmode=require`;
  }

  throw new Error("Missing Postgres connection env vars on this deployment.");
}

function pgClientConfig(): pg.ClientConfig {
  let url = connectionString();
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
  } else {
    url = url.replace(/sslmode=require/g, "sslmode=no-verify");
  }
  return {
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  };
}

export async function applyEventSchema(): Promise<{ applied: string[] }> {
  const root = process.cwd();
  const client = new pg.Client(pgClientConfig());

  const applied: string[] = [];
  await client.connect();
  try {
    for (const relative of SCHEMA_FILES) {
      const filePath = path.join(root, relative);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing schema file: ${relative}`);
      }
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
      applied.push(relative);
    }
  } finally {
    await client.end();
  }

  return { applied };
}
