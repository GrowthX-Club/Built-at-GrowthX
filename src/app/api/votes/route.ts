import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { projectId } = await request.json();
  const user = store.getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = store.vote(projectId);
  if (!result) {
    return NextResponse.json({ error: "Vote failed" }, { status: 400 });
  }

  return NextResponse.json(result);
}
