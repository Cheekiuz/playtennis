import type { MetadataRoute } from "next";
import { localePath, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: absoluteUrl(localePath(locale)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === "lt" ? 1 : 0.9,
  }));
}
