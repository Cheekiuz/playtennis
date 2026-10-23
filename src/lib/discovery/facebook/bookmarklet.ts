import { facebookEventExtractSource } from "@/lib/discovery/facebook/extract-event-script";

/** Generates the bookmarklet javascript: URL. Keep this self-contained for the browser. */
export function facebookEventBookmarklet(catchBaseUrl: string): string {
  const source = facebookEventExtractSource(catchBaseUrl);
  return `javascript:${encodeURIComponent(source)}`;
}
