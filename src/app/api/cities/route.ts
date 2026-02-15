import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const cities = store.getCities();
  return NextResponse.json({ cities });
}
