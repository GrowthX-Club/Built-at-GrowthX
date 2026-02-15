import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = store.getProject(Number(params.id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
