import type { Metadata } from "next";
import CourtAlertsPage from "@/components/CourtAlertsPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";
import { buildCourtAlertsMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildCourtAlertsMetadata("lt");
}

export default function CourtAlertsLtPage() {
  const messages = getMessages("lt");

  return (
    <LocaleProvider key="lt" locale="lt" messages={messages}>
      <CourtAlertsPage />
    </LocaleProvider>
  );
}
