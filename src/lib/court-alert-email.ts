import { isValidEmail, normalizeEmail } from "@/lib/email";
import type { AlertMatch } from "@/lib/court-monitoring-types";
import { formatSlotTimeRange } from "@/lib/court-alerts-matcher";
import { getClubLabel } from "@/lib/court-alerts-config";

interface SendAlertEmailParams {
  matches: AlertMatch[];
  locale?: "en" | "lt";
}

function sortMatches(matches: AlertMatch[]): AlertMatch[] {
  return [...matches].sort((a, b) => {
    const byTime = a.slotStart.localeCompare(b.slotStart);
    if (byTime !== 0) return byTime;
    return a.courtLabel.localeCompare(b.courtLabel);
  });
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? "PlayTennis.lt <alerts@playtennis.lt>";
  return { apiKey, from };
}

function statusLabelForMatch(match: AlertMatch, locale: "en" | "lt"): string {
  if (locale === "en") {
    return match.slotStatus === "for_sale" ? "resale" : "available";
  }
  return match.slotStatus === "for_sale" ? "perpardavimas" : "laisva";
}

function buildEmailContent(params: SendAlertEmailParams) {
  const sorted = sortMatches(params.matches);
  const match = sorted[0];
  const locale = params.locale ?? "lt";
  const clubLabel = getClubLabel("vilnius", match.club);
  const date = match.slotStart.slice(0, 10);
  const bookingUrl = "https://book.sebarena.lt/#/rezervuoti/tenisas";

  if (sorted.length === 1) {
    const timeRange = formatSlotTimeRange(match.slotStart, match.slotEnd, locale);

    if (locale === "en") {
      const statusLabel =
        match.slotStatus === "for_sale" ? "available for resale" : "available";
      return {
        subject: `Court alert: ${clubLabel} — ${timeRange}`,
        html: `
          <p>A tennis court matching your alert is now <strong>${statusLabel}</strong>.</p>
          <ul>
            <li><strong>Venue:</strong> ${clubLabel}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${timeRange}</li>
            <li><strong>Court:</strong> ${match.courtLabel}</li>
          </ul>
          <p><a href="${bookingUrl}">Book on SEB Arena</a> before someone else takes it.</p>
          <p style="color:#666;font-size:12px;">PlayTennis.lt Court Alerts</p>
        `,
      };
    }

    const statusLabel =
      match.slotStatus === "for_sale" ? "parduodamas laikas" : "laisva kortas";
    return {
      subject: `Kortų pranešimas: ${clubLabel} — ${timeRange}`,
      html: `
        <p>Atsirado ${statusLabel}, atitinkantis jūsų pranešimą.</p>
        <ul>
          <li><strong>Vieta:</strong> ${clubLabel}</li>
          <li><strong>Data:</strong> ${date}</li>
          <li><strong>Laikas:</strong> ${timeRange}</li>
          <li><strong>Kortas:</strong> ${match.courtLabel}</li>
        </ul>
        <p><a href="${bookingUrl}">Rezervuokite SEB Arenoje</a>, kol laisvas laikas nėra užimtas.</p>
        <p style="color:#666;font-size:12px;">PlayTennis.lt Kortų pranešimai</p>
      `,
    };
  }

  const slotItems = sorted
    .map((m) => {
      const timeRange = formatSlotTimeRange(m.slotStart, m.slotEnd, locale);
      const status = statusLabelForMatch(m, locale);
      return `<li><strong>${m.courtLabel}</strong> — ${timeRange} (${status})</li>`;
    })
    .join("\n          ");

  if (locale === "en") {
    const countLabel = sorted.length === 1 ? "1 slot" : `${sorted.length} slots`;
    return {
      subject: `Court alert: ${clubLabel} — ${countLabel} available`,
      html: `
        <p><strong>${sorted.length}</strong> court slots matching your alert are now available:</p>
        <ul>
          <li><strong>Venue:</strong> ${clubLabel}</li>
          <li><strong>Date:</strong> ${date}</li>
        </ul>
        <ul>
          ${slotItems}
        </ul>
        <p><a href="${bookingUrl}">Book on SEB Arena</a> before someone else takes them.</p>
        <p style="color:#666;font-size:12px;">PlayTennis.lt Court Alerts</p>
      `,
    };
  }

  const countLabel = sorted.length === 1 ? "1 laisvas laikas" : `${sorted.length} laisvi laikai`;
  return {
    subject: `Kortų pranešimas: ${clubLabel} — ${countLabel}`,
    html: `
      <p>Atsirado <strong>${sorted.length}</strong> jūsų pranešimą atitinkantys laisvi laikai:</p>
      <ul>
        <li><strong>Vieta:</strong> ${clubLabel}</li>
        <li><strong>Data:</strong> ${date}</li>
      </ul>
      <ul>
        ${slotItems}
      </ul>
      <p><a href="${bookingUrl}">Rezervuokite SEB Arenoje</a>, kol laisvų laikų nėra užimta.</p>
      <p style="color:#666;font-size:12px;">PlayTennis.lt Kortų pranešimai</p>
    `,
  };
}

export async function sendCourtAlertEmail(params: SendAlertEmailParams): Promise<boolean> {
  const { matches } = params;
  if (matches.length === 0) return false;

  const match = matches[0];
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

function sampleAlertMatch(): AlertMatch {
  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T18:00:00+03:00`;
  const slotEnd = `${today}T19:00:00+03:00`;

  return {
    alertId: "00000000-0000-0000-0000-000000000000",
    email: null,
    notifyEmail: true,
    club: "seb-arena",
    courtId: "5",
    courtLabel: "5",
    slotStart,
    slotEnd,
    slotStatus: "for_sale",
  };
}

export async function sendTestCourtAlertEmail(
  to: string,
  locale: "en" | "lt" = "lt",
): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(to);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Invalid email address" };
  }

  const { apiKey, from } = getResendConfig();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const match = sampleAlertMatch();
  const { subject, html } = buildEmailContent({ matches: [match], locale });
  const testLabel = locale === "en" ? "Test notification" : "Bandomasis pranešimas";
  const testSubject = locale === "en" ? `[Test] ${subject}` : `[Testas] ${subject}`;
  const testHtml = `<p style="color:#888;font-size:12px;"><strong>${testLabel}</strong></p>${html}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: testSubject,
      html: testHtml,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[court-alert-email] Test send error:", res.status, body);
    return { ok: false, error: body || `Resend HTTP ${res.status}` };
  }

  return { ok: true };
}
