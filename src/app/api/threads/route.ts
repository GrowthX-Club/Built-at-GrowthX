import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const threads = store.getThreads();
  return NextResponse.json({ threads });
}
