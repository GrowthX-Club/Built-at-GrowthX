import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const weeks = store.getWeeklyTimeline();
  return NextResponse.json({ weeks });
}
