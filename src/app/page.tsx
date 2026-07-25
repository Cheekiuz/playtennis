import LandingPage from "@/components/LandingPage";
import { LocaleProvider } from "@/context/LocaleContext";
import { getMessages } from "@/lib/i18n";

export default function HomePage() {
  const messages = getMessages("en");

  return (
    <LocaleProvider locale="en" messages={messages}>
      <LandingPage messages={messages} />
    </LocaleProvider>
  );
}
