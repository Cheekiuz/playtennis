import type { MetadataRoute } from "next";
import { localePath, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/court-alerts"];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, path)),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "/" ? (locale === "lt" ? 1 : 0.9) : locale === "lt" ? 0.8 : 0.7,
      });
    }
  }

  return entries;
}
