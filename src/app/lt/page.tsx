import LandingPage from "@/components/LandingPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";

export default function LithuanianPage() {
  const messages = getMessages("lt");

  return (
    <LocaleProvider key="lt" locale="lt" messages={messages}>
      <LandingPage messages={messages} />
    </LocaleProvider>
  );
}
