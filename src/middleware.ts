import { NextRequest, NextResponse } from "next/server";

const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/projects\/([^/]+)$/);

  if (match && OBJECTID_RE.test(match[1])) {
    try {
      const res = await fetch(`${API_BASE}/bx/projects/${match[1]}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const slug = data.project?.slug;
        if (slug && slug !== match[1]) {
          const url = request.nextUrl.clone();
          url.pathname = `/projects/${slug}`;
          return NextResponse.redirect(url, 301);
        }
      }
    } catch {
      // If API unavailable, serve the page with the ObjectId (no redirect)
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/projects/:id+",
};
