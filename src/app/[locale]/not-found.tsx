import Link from "next/link";
import { headers } from "next/headers";
import { getLocaleFromPathname, getMessages, isValidLocale, localePath } from "@/lib/i18n";

export default async function NotFound() {
  const headerList = await headers();
  const localeHeader = headerList.get("x-locale") ?? "lt";
  const locale = isValidLocale(localeHeader) ? localeHeader : getLocaleFromPathname("/");
  const messages = getMessages(locale);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6">
      <h1 className="text-3xl font-bold">{messages.discover.notFoundTitle}</h1>
      <p className="mt-3 text-foreground/70">{messages.discover.notFoundBody}</p>
      <Link href={localePath(locale, "/tournaments")} className="mt-6 font-semibold text-accent hover:underline">
        {messages.discover.browseAll}
      </Link>
    </main>
  );
}
