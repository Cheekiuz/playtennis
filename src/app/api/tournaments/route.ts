import { NextResponse } from "next/server";
import { getTournamentsByIds } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids") ?? "";
  const requested = ids.split(",").map((id) => id.trim()).filter(Boolean);

  try {
    const tournaments = await getTournamentsByIds(requested);
    return NextResponse.json({ tournaments, ok: true as const });
  } catch (error) {
    console.error("GET /api/tournaments", error);
    return NextResponse.json(
      { tournaments: [], ok: false as const, error: "Could not load tournaments." },
      { status: 500 },
    );
  }
}
