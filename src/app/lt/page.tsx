import LandingPage from "@/components/LandingPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";

export default function LithuanianPage() {
  return (
    <LocaleProvider locale="lt" messages={getMessages("lt")}>
      <LandingPage />
    </LocaleProvider>
  );
}
