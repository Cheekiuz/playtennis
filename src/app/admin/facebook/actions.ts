"use server";

import {
  DEFAULT_FACEBOOK_PASTE_SOURCE_ID,
  importFacebookEventUrlsForSource,
  type FacebookUrlImportResult,
} from "@/lib/discovery/facebook/manual-url-store";
import { requireAdmin } from "@/lib/tournaments/admin";

export type FacebookImportState = FacebookUrlImportResult & { ok?: boolean };

export async function importFacebookEventUrls(_prev: FacebookImportState, formData: FormData): Promise<FacebookImportState> {
  await requireAdmin();

  const pasted = String(formData.get("urls") ?? "");
  const sourceId = String(formData.get("source_id") ?? DEFAULT_FACEBOOK_PASTE_SOURCE_ID).trim();
  const result = await importFacebookEventUrlsForSource(sourceId, pasted);
  return { ...result, ok: result.errors.length === 0 || result.created > 0 || result.updated > 0 };
}
