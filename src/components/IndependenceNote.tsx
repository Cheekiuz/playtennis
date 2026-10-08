import type { Messages } from "@/lib/i18n";

export default function IndependenceNote({
  messages,
  className = "",
}: {
  messages: Messages;
  className?: string;
}) {
  const d = messages.discover;

  return (
    <section className={className}>
      <h2 className="text-2xl font-bold tracking-tight">{d.independentTitle}</h2>
      <p className="mt-3 text-base leading-7 text-foreground/80">{d.independentBody}</p>
    </section>
  );
}
