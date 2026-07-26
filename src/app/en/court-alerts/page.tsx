import type { Metadata } from "next";
import CourtAlertsPage from "@/components/CourtAlertsPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";
import { buildCourtAlertsMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildCourtAlertsMetadata("en");
}

export default function CourtAlertsEnPage() {
  const messages = getMessages("en");

  return (
    <LocaleProvider key="en" locale="en" messages={messages}>
      <CourtAlertsPage />
    </LocaleProvider>
  );
}
