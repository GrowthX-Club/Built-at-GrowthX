/**
 * Mock API layer for local development without backend access.
 * Returns seed data for all bxApi/gxApi endpoints when NEXT_PUBLIC_MOCK_MODE=true.
 */
import {
  seedProjects,
  seedBuilding,
  seedBuilders,
  seedCities,
  seedThreads,
} from "./seed-data";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Parse path and query from a relative URL like "/projects?limit=10&offset=0" */
function parsePath(url: string): { path: string; params: URLSearchParams } {
  const [path, qs] = url.split("?");
  return { path, params: new URLSearchParams(qs || "") };
}

const MOCK_USER = {
  _id: "mock-user-001",
  name: "Demo User",
  initials: "DU",
  avatar: "DU",
  city: "Bangalore",
  rep: 100,
  shipped: 0,
  bio: "Local dev contributor",
  company: "Open Source",
  company_color: "#181710",
  is_membership_active: true,
};

/** Handle a bxApi call with mock data. Returns null if unhandled. */
export function mockBxApi(path: string, init?: RequestInit): Response | null {
  const { path: route, params } = parsePath(path);
  const method = init?.method?.toUpperCase() || "GET";

  // GET /me
  if (route === "/me" && method === "GET") {
    return jsonResponse({ user: MOCK_USER });
  }

  // POST /logout
  if (route === "/logout" && method === "POST") {
    return jsonResponse({ success: true });
  }

  // GET /projects
  if (route === "/projects" && method === "GET") {
    const limit = parseInt(params.get("limit") || "20", 10);
    const offset = parseInt(params.get("offset") || "0", 10);
    const slice = seedProjects.slice(offset, offset + limit);
    return jsonResponse({
      projects: slice,
      totalCount: seedProjects.length,
      votedProjectIds: [],
    });
  }

  // GET /projects/:id
  const projectMatch = route.match(/^\/projects\/(.+)$/);
  if (projectMatch && method === "GET") {
    const id = projectMatch[1];
    const project = seedProjects.find(
      (p) => String(p.id) === id || String(p.name).toLowerCase().replace(/\s+/g, "-") === id
    );
    return jsonResponse(project ? { project } : { project: null });
  }

  // POST /projects
  if (route === "/projects" && method === "POST") {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    return jsonResponse({ project: { id: "mock-new", name: body.name || "New Project", isDraft: body.isDraft || false, buildProcess: body.buildProcess || "" } });
  }

  // PUT /projects/:id
  if (projectMatch && method === "PUT") {
    return jsonResponse({ project: { id: projectMatch[1] }, success: true });
  }

  // POST /votes
  if (route === "/votes" && method === "POST") {
    return jsonResponse({ success: true });
  }

  // GET /comments
  if (route === "/comments" && method === "GET") {
    return jsonResponse({ comments: [] });
  }

  // POST /comments
  if (route === "/comments" && method === "POST") {
    return jsonResponse({
      comment: {
        id: "mock-comment-" + Date.now(),
        content: "Mock comment",
        createdAt: new Date().toISOString(),
      },
    });
  }

  // POST /comments/:id/react
  if (route.match(/^\/comments\/.+\/react$/) && method === "POST") {
    return jsonResponse({ success: true });
  }

  // GET /building
  if (route === "/building" && method === "GET") {
    return jsonResponse({ buildings: seedBuilding });
  }

  // GET /members
  if (route === "/members" && method === "GET") {
    return jsonResponse({ members: seedBuilders });
  }

  // GET /cities
  if (route === "/cities" && method === "GET") {
    return jsonResponse({ cities: seedCities });
  }

  // GET /threads
  if (route === "/threads" && method === "GET") {
    return jsonResponse({ threads: seedThreads });
  }

  // GET /users/search
  if (route === "/users/search" && method === "GET") {
    const q = (params.get("q") || "").toLowerCase();
    const matched = seedBuilders
      .filter((b) => b.name.toLowerCase().includes(q))
      .map((b) => ({ _id: b._id || b.name, name: b.name, initials: b.avatar }));
    return jsonResponse({ users: matched });
  }

  // GET /my-projects
  if (route === "/my-projects" && method === "GET") {
    return jsonResponse({ projects: [] });
  }

  // GET /api-keys
  if (route === "/api-keys" && method === "GET") {
    return jsonResponse({ success: true, api_keys: [] });
  }

  // POST /api-keys
  if (route === "/api-keys" && method === "POST") {
    return jsonResponse({ success: true, api_key: "mock_bx_key_demo_123", msg: "API key created" });
  }

  // DELETE /api-keys/:id
  if (route.match(/^\/api-keys\/.+$/) && method === "DELETE") {
    return jsonResponse({ success: true, msg: "API key revoked" });
  }

  return null;
}

/** Handle a gxApi call with mock data (auth endpoints). Returns null if unhandled. */
export function mockGxApi(path: string, init?: RequestInit): Response | null {
  const { path: route } = parsePath(path);
  const method = init?.method?.toUpperCase() || "GET";

  // POST /cauth/send_otp
  if (route === "/cauth/send_otp" && method === "POST") {
    return jsonResponse({ success: true, msg: "OTP sent (mock mode)" });
  }

  // POST /cauth/login
  if (route === "/cauth/login" && method === "POST") {
    return jsonResponse({
      success: true,
      token: "mock-jwt-token",
      user: MOCK_USER,
    });
  }

  // POST /cauth/register
  if (route === "/cauth/register" && method === "POST") {
    return jsonResponse({
      success: true,
      token: "mock-jwt-token",
      user: MOCK_USER,
    });
  }

  // POST /cauth/retry_otp
  if (route === "/cauth/retry_otp" && method === "POST") {
    return jsonResponse({ success: true, msg: "OTP resent (mock mode)" });
  }

  return null;
}
