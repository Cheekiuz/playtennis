import type { Metadata } from "next";
import DashboardPage from "@/components/DashboardPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";
import { buildDashboardMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardMetadata("en");
}

export default function DashboardEnPage() {
  const messages = getMessages("en");

  return (
    <LocaleProvider key="en" locale="en" messages={messages}>
      <DashboardPage />
    </LocaleProvider>
  );
}
