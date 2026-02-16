import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const projects = store.getProjects();
  const user = store.getCurrentUser();
  const votedIds = user ? store.getVotedProjectIds(user.name) : [];
  return NextResponse.json({ projects, votedIds });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = store.getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const project = store.createProject(body);
  if (!project) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 400 });
  }

  return NextResponse.json({ project }, { status: 201 });
}
