import { buildLlmsTxt, LLMS_HEADERS } from "@/lib/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await buildLlmsTxt(), { headers: LLMS_HEADERS });
}
