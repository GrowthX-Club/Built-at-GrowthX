import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );
  }

  const comments = store.getCommentsForProject(projectId);
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const { projectId, content, parentId } = await request.json();
  const currentUser = store.getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const comment = store.addComment(
    projectId,
    currentUser._id,
    content,
    parentId
  );
  if (!comment) {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 400 }
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}
