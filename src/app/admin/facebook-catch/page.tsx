import FacebookBookmarkletCatch from "@/components/admin/FacebookBookmarkletCatch";

export const dynamic = "force-dynamic";

export default function AdminFacebookCatchPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Review Facebook event</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Check the start date, then import. Facebook often sends the wrong date automatically.
      </p>
      <FacebookBookmarkletCatch />
    </div>
  );
}
