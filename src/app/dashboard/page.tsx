import type { Metadata } from "next";
import DashboardPage from "@/components/DashboardPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";
import { buildDashboardMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardMetadata("lt");
}

export default function DashboardLtPage() {
  const messages = getMessages("lt");

  return (
    <LocaleProvider key="lt" locale="lt" messages={messages}>
      <DashboardPage />
    </LocaleProvider>
  );
}
