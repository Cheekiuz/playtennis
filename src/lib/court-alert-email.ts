import { isValidEmail, normalizeEmail } from "@/lib/email";
import type { AlertMatch } from "@/lib/court-monitoring-types";
import { formatSlotTimeRange } from "@/lib/court-alerts-matcher";
import { getClubLabel } from "@/lib/court-alerts-config";

interface SendAlertEmailParams {
  match: AlertMatch;
  locale?: "en" | "lt";
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? "PlayTennis.lt <alerts@playtennis.lt>";
  return { apiKey, from };
}

function buildEmailContent(match: SendAlertEmailParams) {
  const locale = match.locale ?? "lt";
  const clubLabel = getClubLabel("vilnius", match.match.club);
  const timeRange = formatSlotTimeRange(match.match.slotStart, match.match.slotEnd, locale);
  const date = match.match.slotStart.slice(0, 10);
  const bookingUrl = "https://book.sebarena.lt/#/rezervuoti/tenisas";

  if (locale === "en") {
    const statusLabel =
      match.match.slotStatus === "for_sale" ? "available for resale" : "available";
    return {
      subject: `Court alert: ${clubLabel} — ${timeRange}`,
      html: `
        <p>A tennis court matching your alert is now <strong>${statusLabel}</strong>.</p>
        <ul>
          <li><strong>Venue:</strong> ${clubLabel}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${timeRange}</li>
          <li><strong>Court:</strong> ${match.match.courtLabel}</li>
        </ul>
        <p><a href="${bookingUrl}">Book on SEB Arena</a> before someone else takes it.</p>
        <p style="color:#666;font-size:12px;">PlayTennis.lt Court Alerts</p>
      `,
    };
  }

  const statusLabel =
    match.match.slotStatus === "for_sale" ? "parduodamas laikas" : "laisva kortas";
  return {
    subject: `Kortų pranešimas: ${clubLabel} — ${timeRange}`,
    html: `
      <p>Atsirado ${statusLabel}, atitinkantis jūsų pranešimą.</p>
      <ul>
        <li><strong>Vieta:</strong> ${clubLabel}</li>
        <li><strong>Data:</strong> ${date}</li>
        <li><strong>Laikas:</strong> ${timeRange}</li>
        <li><strong>Kortas:</strong> ${match.match.courtLabel}</li>
      </ul>
      <p><a href="${bookingUrl}">Rezervuokite SEB Arenoje</a>, kol laisvas laikas nėra užimtas.</p>
      <p style="color:#666;font-size:12px;">PlayTennis.lt Kortų pranešimai</p>
    `,
  };
}

export async function sendCourtAlertEmail(params: SendAlertEmailParams): Promise<boolean> {
  const { match } = params;

  if (!match.notifyEmail || !match.email) {
    return false;
  }

  const email = normalizeEmail(match.email);
  if (!isValidEmail(email)) {
    return false;
  }

  const { apiKey, from } = getResendConfig();
  if (!apiKey) {
    console.warn("[court-alert-email] RESEND_API_KEY not set — skipping email");
    return false;
  }

  const { subject, html } = buildEmailContent(params);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[court-alert-email] Resend error:", res.status, body);
    return false;
  }

  return true;
}
