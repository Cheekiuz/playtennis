/**
 * Manually run the production court monitor (same as the GitHub Actions cron).
 * Requires CRON_SECRET in .env.local or env; optional SITE_URL (defaults to production).
 *
 * Usage: node scripts/trigger-court-monitor.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const key = trimmed.slice(0, eq);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const secret = process.env.CRON_SECRET;
const base = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.playtennis.lt").replace(
  /\/$/,
  "",
);

if (!secret) {
  console.error("Missing CRON_SECRET. Add it to .env.local or export it in your shell.");
  process.exit(1);
}

const url = `${base}/api/cron/monitor-courts`;
console.log(`POST ${url}`);

const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await res.text();
let parsed;
try {
  parsed = JSON.parse(body);
  console.log(JSON.stringify(parsed, null, 2));
} catch {
  console.log(body);
}

if (!res.ok) {
  process.exit(1);
}
