import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const builders = store.getBuilders();
  return NextResponse.json({ builders });
}
