import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const projects = store.getProjects();
  return NextResponse.json({ projects });
}
