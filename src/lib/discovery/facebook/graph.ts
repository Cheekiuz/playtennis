import { politeFetch } from "@/lib/discovery/http";
import type { FacebookPostInput } from "@/lib/discovery/facebook/extract";
import type { RegistrySource } from "@/lib/discovery/registry-types";

export type FacebookFetchResult = {
  posts: FacebookPostInput[];
  error: string | null;
  requiresManualHandling: boolean;
};

import { facebookAccessToken } from "@/lib/discovery/facebook/graph-events";
import { manualEventUrls } from "@/lib/discovery/facebook/public-event-page";

function manualEventUrlsFallback(source: RegistrySource): boolean {
  return manualEventUrls(source).length === 0;
}

function accessToken(): string | null {
  return facebookAccessToken();
}

function facebookTargetId(source: RegistrySource): string | null {
  const meta = source.metadata;
  if (typeof meta.facebookId === "string" && meta.facebookId) return meta.facebookId;
  if (typeof meta.pageId === "string" && meta.pageId) return meta.pageId;
  if (typeof meta.groupId === "string" && meta.groupId) return meta.groupId;

  const url = source.facebookUrl ?? source.url;
  const numericGroup = url.match(/facebook\.com\/groups\/(\d+)/i);
  if (numericGroup) return numericGroup[1];
  const slugMatch = url.match(/facebook\.com\/(?:groups|pages|events)\/([^/?#]+)/i);
  return slugMatch ? slugMatch[1] : null;
}

export async function fetchFacebookPosts(source: RegistrySource, limit?: number): Promise<FacebookFetchResult> {
  const defaultLimit =
    source.registrySourceType === "FACEBOOK_GROUP"
      ? typeof source.metadata.feedLimit === "number"
        ? source.metadata.feedLimit
        : 50
      : 15;
  const pageSize = limit ?? defaultLimit;
  const token = accessToken();
  if (!token) {
    return {
      posts: [],
      error: null,
      requiresManualHandling: manualEventUrlsFallback(source),
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
  url.searchParams.set("limit", String(pageSize));
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
        attachments?: {
          data?: Array<{ target?: { id?: string }; media_type?: string; title?: string; description?: string }>;
        };
      }>;
    };

    const posts: FacebookPostInput[] = (json.data ?? [])
      .filter((row) => row.message?.trim() || row.attachments?.data?.some((item) => item.target?.id))
      .map((row) => {
        const attachment = row.attachments?.data?.[0];
        const fallbackText = [attachment?.title, attachment?.description].filter(Boolean).join("\n");
        return {
        id: row.id,
        message: row.message?.trim() || fallbackText || "",
        permalink: row.permalink_url ?? `https://www.facebook.com/${row.id}`,
        createdTime: row.created_time ?? null,
        eventLink: attachment?.target?.id
          ? `https://www.facebook.com/events/${attachment.target.id}`
          : null,
      };
      });

    return { posts, error: null, requiresManualHandling: false };
  } catch (error) {
    return {
      posts: [],
      error: error instanceof Error ? error.message : "Facebook fetch failed.",
      requiresManualHandling: true,
    };
  }
}
