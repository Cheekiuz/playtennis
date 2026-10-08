import { politeFetch } from "@/lib/discovery/http";
import type { FacebookPostInput } from "@/lib/discovery/facebook/extract";
import type { RegistrySource } from "@/lib/discovery/registry-types";

export type FacebookFetchResult = {
  posts: FacebookPostInput[];
  error: string | null;
  requiresManualHandling: boolean;
};

function accessToken(): string | null {
  const token = process.env.FACEBOOK_ACCESS_TOKEN?.trim();
  if (!token || token.includes("SENSITIVE")) return null;
  return token;
}

function facebookTargetId(source: RegistrySource): string | null {
  const meta = source.metadata;
  if (typeof meta.facebookId === "string" && meta.facebookId) return meta.facebookId;
  if (typeof meta.pageId === "string" && meta.pageId) return meta.pageId;
  if (typeof meta.groupId === "string" && meta.groupId) return meta.groupId;

  const url = source.facebookUrl ?? source.url;
  const slugMatch = url.match(/facebook\.com\/(?:groups|pages|events)\/([^/?#]+)/i);
  return slugMatch ? slugMatch[1] : null;
}

export async function fetchFacebookPosts(source: RegistrySource, limit = 15): Promise<FacebookFetchResult> {
  const token = accessToken();
  if (!token) {
    return {
      posts: [],
      error: "FACEBOOK_ACCESS_TOKEN is not set. Facebook Graph API access is required for live group/page scraping.",
      requiresManualHandling: true,
    };
  }

  const target = facebookTargetId(source);
  if (!target) {
    return {
      posts: [],
      error: "Could not resolve a Facebook page or group id from the registry entry.",
      requiresManualHandling: true,
    };
  }

  const isGroup = source.registrySourceType === "FACEBOOK_GROUP";
  const edge = isGroup ? "feed" : "posts";
  const path = isGroup
    ? `https://graph.facebook.com/v21.0/${encodeURIComponent(target)}/${edge}`
    : `https://graph.facebook.com/v21.0/${encodeURIComponent(target)}/${edge}`;

  const url = new URL(path);
  url.searchParams.set("fields", "id,message,permalink_url,created_time,attachments{target{id}}");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  try {
    const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) {
      const body = await response.text();
      return {
        posts: [],
        error: `Facebook Graph API ${response.status}: ${body.slice(0, 200)}`,
        requiresManualHandling: true,
      };
    }
    const json = (await response.json()) as {
      data?: Array<{
        id: string;
        message?: string;
        permalink_url?: string;
        created_time?: string;
        attachments?: { data?: Array<{ target?: { id?: string } }> };
      }>;
    };

    const posts: FacebookPostInput[] = (json.data ?? [])
      .filter((row) => row.message?.trim())
      .map((row) => ({
        id: row.id,
        message: row.message ?? "",
        permalink: row.permalink_url ?? `https://www.facebook.com/${row.id}`,
        createdTime: row.created_time ?? null,
        eventLink: row.attachments?.data?.[0]?.target?.id
          ? `https://www.facebook.com/events/${row.attachments.data[0].target.id}`
          : null,
      }));

    return { posts, error: null, requiresManualHandling: false };
  } catch (error) {
    return {
      posts: [],
      error: error instanceof Error ? error.message : "Facebook fetch failed.",
      requiresManualHandling: true,
    };
  }
}
