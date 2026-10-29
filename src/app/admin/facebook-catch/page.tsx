import Link from "next/link";
import FacebookBookmarkletCatch from "@/components/admin/FacebookBookmarkletCatch";

export const dynamic = "force-dynamic";

export default function AdminFacebookCatchPage() {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Sources</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">Review Facebook event</h1>
      <p className="mt-2 text-sm text-[#747874]">
        Check the start date, then import. Facebook often sends the wrong date automatically.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/admin/facebook" className="font-semibold text-[#111915] underline-offset-2 hover:underline">
          ← Back to Facebook import
        </Link>
      </p>
      <FacebookBookmarkletCatch />
    </div>
  );
}
