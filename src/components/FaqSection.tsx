import type { FaqItem } from "@/lib/structured-data";

/** Visible FAQ. The same items feed the FAQPage JSON-LD on the page, so markup and content always match. */
export default function FaqSection({
  title,
  items,
  className = "",
}: {
  title: string;
  items: FaqItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={className} aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-5 divide-y divide-[#e7e7e2] overflow-hidden rounded-2xl border border-[#e7e7e2] bg-white text-[#111915]">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true" className="text-xl leading-none text-[#747874] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#434845]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
