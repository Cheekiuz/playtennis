import { NextResponse } from "next/server";
import { getTournamentsByIds } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids") ?? "";
  const tournaments = await getTournamentsByIds(ids.split(",").filter(Boolean));
  return NextResponse.json({ tournaments });
}
