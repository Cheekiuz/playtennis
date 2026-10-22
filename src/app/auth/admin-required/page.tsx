import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-bold">Admin access needed</h1>
      <p className="mt-4 text-base text-foreground/80">
        You signed in{email ? ` as ${email}` : ""}, but this account is not on the admin list.
      </p>
      <p className="mt-3 text-sm text-foreground/70">
        Ask the site owner to add your Google email to <code className="text-foreground">ADMIN_EMAILS</code> on
        Vercel, or set <code className="text-foreground">profiles.role = admin</code> in Supabase.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/auth/logout?next=/lt" className="font-semibold text-accent underline-offset-2 hover:underline">
          Sign out and try another account
        </Link>
      </p>
      <p className="mt-3 text-sm">
        <Link href="/lt" className="font-semibold text-accent underline-offset-2 hover:underline">
          Back to the site
        </Link>
      </p>
    </div>
  );
}
