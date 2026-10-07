import type { Messages } from "@/lib/i18n";

export default function IndependenceNote({
  messages,
  className = "mt-16",
}: {
  messages: Messages;
  className?: string;
}) {
  const d = messages.discover;

  return (
    <section className={`mx-auto w-full max-w-xl text-center ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight">{d.independentTitle}</h2>
      <div className="mt-5 grid gap-1.5 text-base leading-relaxed text-foreground/75">
        <p>{d.independentNotOrganise}</p>
        <p>{d.independentNotMemberships}</p>
        <p>{d.independentNotPromote}</p>
      </div>
      <p className="mt-5 text-base leading-relaxed text-foreground/90">{d.independentBody}</p>
    </section>
  );
}
