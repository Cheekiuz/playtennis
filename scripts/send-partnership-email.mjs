/**
 * Send SEB Arena partnership outreach email via Resend.
 * Requires RESEND_API_KEY and OUTREACH_FROM in env (.env.local or Vercel).
 * Usage: node scripts/send-partnership-email.mjs [your-email@domain.com]
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
      if (!process.env[trimmed.slice(0, eq)]) {
        process.env[trimmed.slice(0, eq)] = value;
      }
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.OUTREACH_FROM ??
  process.env.ALERT_EMAIL_FROM ??
  "PlayTennis.lt <onboarding@resend.dev>";
const replyTo = process.argv[2] ?? process.env.OUTREACH_REPLY_TO;

if (!apiKey) {
  console.error("Missing RESEND_API_KEY. Sign up at https://resend.com and add the key.");
  process.exit(1);
}

if (!replyTo) {
  console.error("Usage: node scripts/send-partnership-email.mjs your-reply-to@email.com");
  process.exit(1);
}

const subject = "PlayTennis.lt — read-only court availability integration for SEB Arena";

const html = `
<p>Sveiki / Hello,</p>

<p>Kuriame <strong>PlayTennis.lt</strong> — teniso bendruomenės platformą Lietuvoje. Paleidome funkciją <strong>Kortų pranešimai</strong> (Court Alerts), kuri praneša žaidėjams, kai atsiranda laisva kortas pagal jų pageidavimus.</p>

<p>We would like to integrate with <strong>SEB Arena's reservation system</strong> (book.sebarena.lt) in a <strong>read-only</strong> way: poll or receive updates on court availability (free slots, cancellations, resales), match against user alert preferences, and notify users by email so they can book on your official portal.</p>

<p><strong>We do not need automated booking or payment access.</strong></p>

<p>Could you provide one of the following?</p>
<ol>
  <li>A read-only API or webhook for availability and cancellation/resale events</li>
  <li>A partner/service account for programmatic read access</li>
  <li>An introduction to Digitouch (booking system vendor) for technical integration</li>
</ol>

<p>Happy to sign an NDA and follow your branding requirements.</p>

<p>Thank you / Dėkojame,<br/>
PlayTennis.lt<br/>
<a href="https://www.playtennis.lt">www.playtennis.lt</a></p>
`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: ["info@tenisopasaulis.lt"],
    reply_to: replyTo,
    subject,
    html,
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Failed to send:", res.status, body);
  process.exit(1);
}

console.log("Partnership email sent to info@tenisopasaulis.lt");
console.log(body);
