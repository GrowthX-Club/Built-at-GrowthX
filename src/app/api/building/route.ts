import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const building = store.getBuilding();
  return NextResponse.json({ building });
}
