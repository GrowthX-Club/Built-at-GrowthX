import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeFilter =
    (searchParams.get("time") as "all" | "month" | "week") || "all";

  const builders = store.getBuilderLeaderboard(timeFilter);
  return NextResponse.json({ builders });
}
