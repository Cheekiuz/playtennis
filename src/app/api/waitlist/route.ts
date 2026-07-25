import { isValidEmail, normalizeEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("email" in body)) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const rawEmail = (body as { email: unknown }).email;
  if (typeof rawEmail !== "string") {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Waitlist is temporarily unavailable" }, { status: 500 });
  }

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "You're already on the list!", alreadyRegistered: true },
        { status: 409 },
      );
    }
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
