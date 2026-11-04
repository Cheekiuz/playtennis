import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/**
 * AI crawlers that fetch pages for answers (search/citation) or model training.
 * The goal is visibility in AI answers, so all are allowed. To opt a bot out, move it to `AI_BOTS_BLOCKED`.
 */
const AI_BOTS_ALLOWED = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "MistralAI-User",
  "Amazonbot",
];
const AI_BOTS_BLOCKED: string[] = [];

const PRIVATE_PATHS = ["/admin", "/api/", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_BOTS_ALLOWED.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE_PATHS })),
      ...AI_BOTS_BLOCKED.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
