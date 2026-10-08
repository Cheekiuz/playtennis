import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function pgClientConfig(): pg.ClientConfig {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
  if (!direct || direct.includes("[SENSITIVE]")) {
    throw new Error("Missing Postgres connection env vars on this deployment.");
  }
  let url = direct;
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
  } else {
    url = url.replace(/sslmode=require/g, "sslmode=no-verify");
  }
  return { connectionString: url, ssl: { rejectUnauthorized: false } };
}

/** Applies only the extensible source registry migration (safe to re-run). */
export async function applySourceRegistry(): Promise<{ applied: string[] }> {
  const filePath = path.join(process.cwd(), "supabase/source-registry.sql");
  if (!fs.existsSync(filePath)) {
    throw new Error("Missing supabase/source-registry.sql");
  }
  const client = new pg.Client(pgClientConfig());
  await client.connect();
  try {
    await client.query(fs.readFileSync(filePath, "utf8"));
    return { applied: ["supabase/source-registry.sql"] };
  } finally {
    await client.end();
  }
}
