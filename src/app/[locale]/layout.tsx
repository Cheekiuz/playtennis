import { notFound } from "next/navigation";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages, isValidLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return [{ locale: "lt" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = getMessages(locale);

  return (
    <LocaleProvider key={locale} locale={locale} messages={messages}>
      {children}
    </LocaleProvider>
  );
}
