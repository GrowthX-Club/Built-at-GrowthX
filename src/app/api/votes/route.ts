import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { projectId } = await request.json();
  const currentUser = store.getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Toggle vote
  if (store.hasVoted(projectId, currentUser._id)) {
    store.removeVote(projectId, currentUser._id);
    const project = store.getProject(projectId);
    return NextResponse.json({
      voted: false,
      weightedScore: project?.weightedScore || 0,
      rawVotes: project?.rawVotes || 0,
    });
  }

  const vote = store.vote(projectId, currentUser._id);
  if (!vote) {
    return NextResponse.json({ error: "Vote failed" }, { status: 400 });
  }

  const project = store.getProject(projectId);
  return NextResponse.json({
    voted: true,
    weightedScore: project?.weightedScore || 0,
    rawVotes: project?.rawVotes || 0,
  });
}
