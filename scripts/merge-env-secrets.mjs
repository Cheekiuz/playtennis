/**
 * Merges Supabase/Postgres secrets from a Vercel pull file into .env.local
 * Usage: node scripts/merge-env-secrets.mjs .env.production.pulled
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve(process.argv[2] ?? ".env.production.pulled");
const targetPath = resolve(".env.local");

const KEYS = [
  "POSTGRES_PASSWORD",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_JWT_SECRET",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function parseEnv(content) {
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return map;
}

const source = parseEnv(readFileSync(sourcePath, "utf8"));
let target = readFileSync(targetPath, "utf8");

let merged = 0;
for (const key of KEYS) {
  const value = source.get(key);
  if (!value || value.includes("[SENSITIVE]")) continue;

  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(target)) {
    target = target.replace(re, line);
  } else {
    target += `\n${line}`;
  }
  merged++;
}

writeFileSync(targetPath, target);
console.log(`Merged ${merged} secret(s) into .env.local`);
