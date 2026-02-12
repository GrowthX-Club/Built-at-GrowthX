import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const member = store.getMember(params.id);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  return NextResponse.json({ member });
}
