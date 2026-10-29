import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SiteModalProvider } from "@/components/SiteModals";
import type { Locale, Messages } from "@/lib/i18n";

export default function SiteFrame({
  locale,
  messages,
  children,
  wide = false,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <SiteModalProvider>
      <div className="public-shell min-h-screen bg-[#fbfbfa] text-[#111915]">
        <SiteHeader />
        <main className={`mx-auto w-full px-4 pb-16 lg:px-12 ${wide ? "max-w-[1440px]" : "max-w-6xl"}`}>{children}</main>
        <SiteFooter locale={locale} messages={messages} />
      </div>
    </SiteModalProvider>
  );
}
