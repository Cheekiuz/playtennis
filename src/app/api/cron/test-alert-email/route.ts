import { sendTestCourtAlertEmail } from "@/lib/court-alert-email";
import { isCronAuthorized } from "@/lib/cron-auth";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawTo =
    body && typeof body === "object" && "to" in body ? (body as { to: unknown }).to : null;
  if (typeof rawTo !== "string" || !rawTo.trim()) {
    return Response.json({ error: "to (email) is required" }, { status: 400 });
  }

  const to = normalizeEmail(rawTo);
  if (!isValidEmail(to)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const localeRaw =
    body && typeof body === "object" && "locale" in body
      ? (body as { locale: unknown }).locale
      : "lt";
  const locale = localeRaw === "en" ? "en" : "lt";

  const result = await sendTestCourtAlertEmail(to, locale);
  if (!result.ok) {
    return Response.json({ error: result.error ?? "Failed to send test email" }, { status: 500 });
  }

  return Response.json({ success: true, to, locale });
}
