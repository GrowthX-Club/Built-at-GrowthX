import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const user = store.getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: NextRequest) {
  const { memberId } = await request.json();
  store.setCurrentUser(memberId || null);
  const user = store.getCurrentUser();
  return NextResponse.json({ user });
}
