import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const cities = store.getCityLeaderboard();
  return NextResponse.json({ cities });
}
