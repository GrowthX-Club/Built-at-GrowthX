import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const events = store.getEvents();
  return NextResponse.json({ events });
}
