import FacebookBookmarkletCatch from "@/components/admin/FacebookBookmarkletCatch";

export const dynamic = "force-dynamic";

export default function AdminFacebookCatchPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Importing Facebook event</h1>
      <p className="mt-2 text-sm text-foreground/70">
        This page receives data from the Facebook bookmarklet and saves it to PlayTennis.
      </p>
      <FacebookBookmarkletCatch />
    </div>
  );
}
