import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get("sort") as "trending" | "newest") || "trending";
  const eventId = searchParams.get("eventId") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const week = searchParams.get("week")
    ? Number(searchParams.get("week"))
    : undefined;

  const projects = store.getProjects({ sort, eventId, category, search, week });
  const currentUser = store.getCurrentUser();
  const votedIds = currentUser
    ? store.getUserVotedProjectIds(currentUser._id)
    : [];

  return NextResponse.json({ projects, votedIds });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const currentUser = store.getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const project = store.createProject(body);
  return NextResponse.json({ project }, { status: 201 });
}
