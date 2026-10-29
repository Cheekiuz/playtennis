import Link from "next/link";

export default function AdminTopBar({
  email,
  crumb,
}: {
  email: string | null;
  crumb: string;
}) {
  const initial = (email?.trim().charAt(0) || "A").toUpperCase();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e7e2] bg-[#fbfbfa] px-4 py-3 sm:px-6">
      <p className="text-xs font-semibold text-[#747874]">
        <Link href="/lt" className="hover:text-[#111915]">
          PlayTennis.lt
        </Link>
        <span className="mx-1.5 text-[#c3c8c3]">/</span>
        <span className="text-[#111915]">{crumb}</span>
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs font-semibold">
          <Link href="/lt" className="rounded px-1.5 py-1 text-[#747874] hover:text-[#111915]">
            LT
          </Link>
          <Link href="/en" className="rounded bg-[#111915] px-1.5 py-1 text-[#c8ff00]">
            EN
          </Link>
        </div>
        <Link
          href="/lt"
          className="hidden rounded-md border border-[#e7e7e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#111915] hover:border-[#111915] sm:inline-flex"
        >
          View calendar ↗
        </Link>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111915] text-xs font-bold text-[#c8ff00]"
          title={email ?? "Admin"}
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
