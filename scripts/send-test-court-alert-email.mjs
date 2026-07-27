/**
 * Send a sample court alert email via Resend (for_sale slot).
 * Requires RESEND_API_KEY in .env.local or env.
 *
 * Usage: node scripts/send-test-court-alert-email.mjs [recipient@email.com]
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

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.ALERT_EMAIL_FROM ?? "PlayTennis.lt <alerts@playtennis.lt>";
const to = process.argv[2] ?? process.env.TEST_ALERT_EMAIL;

if (!apiKey) {
  console.error("Missing RESEND_API_KEY.");
  process.exit(1);
}

if (!to) {
  console.error("Usage: node scripts/send-test-court-alert-email.mjs recipient@email.com");
  process.exit(1);
}

const bookingUrl = "https://book.sebarena.lt/#/rezervuoti/tenisas";
const subject = "Kortų pranešimas: SEB Arena — 18:00–19:00 (testas)";
const html = `
  <p><strong>[Testas]</strong> Atsirado parduodamas laikas, atitinkantis jūsų pranešimą.</p>
  <ul>
    <li><strong>Vieta:</strong> SEB Arena</li>
    <li><strong>Data:</strong> ${new Date().toISOString().slice(0, 10)}</li>
    <li><strong>Laikas:</strong> 18:00–19:00</li>
    <li><strong>Kortas:</strong> 5</li>
  </ul>
  <p><a href="${bookingUrl}">Rezervuokite SEB Arenoje</a>, kol laisvas laikas nėra užimtas.</p>
  <p style="color:#666;font-size:12px;">PlayTennis.lt Kortų pranešimai — testinis laiškas</p>
`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ from, to: [to], subject, html }),
});

const body = await res.text();
console.log(res.status, body);

if (!res.ok) {
  process.exit(1);
}

console.log(`Test alert email sent to ${to}`);
