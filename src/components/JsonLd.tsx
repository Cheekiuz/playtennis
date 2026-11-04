type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Serialises structured data safely for inline <script> use (escapes "<" and line separators). */
export function serializeJsonLd(data: JsonLdProps["data"]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
