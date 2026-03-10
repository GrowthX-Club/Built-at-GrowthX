/**
 * Mock API router.
 *
 * Registers all mock route handlers and matches incoming requests.
 * Contributors: to add a new feature, create a new file in this directory
 * (e.g. bookmarks.ts) and add it to the imports below. See CONTRIBUTING.md.
 */
import { MockRoute, RouteContext } from "./types";

// --- Import all route modules ---
import projectRoutes from "./projects";
import voteRoutes from "./votes";
import commentRoutes from "./comments";
import buildingRoutes from "./building";
import memberRoutes from "./members";
import cityRoutes from "./cities";
import threadRoutes from "./threads";
import apiKeyRoutes from "./api-keys";
import { bxAuthRoutes, gxAuthRoutes } from "./auth";

// --- Aggregate routes ---
const bxRoutes: MockRoute[] = [
  ...bxAuthRoutes,
  ...projectRoutes,
  ...voteRoutes,
  ...commentRoutes,
  ...buildingRoutes,
  ...memberRoutes,
  ...cityRoutes,
  ...threadRoutes,
  ...apiKeyRoutes,
];

const gxRoutes: MockRoute[] = [...gxAuthRoutes];

// --- Router helpers ---

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Match a route path pattern (e.g. "/projects/:id") against an actual path.
 * Returns extracted params or null if no match.
 */
function matchRoute(
  pattern: string,
  actual: string
): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const actualParts = actual.split("/");
  if (patternParts.length !== actualParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = actualParts[i];
    } else if (patternParts[i] !== actualParts[i]) {
      return null;
    }
  }
  return params;
}

function parsePath(url: string): { path: string; query: URLSearchParams } {
  const [path, qs] = url.split("?");
  return { path, query: new URLSearchParams(qs || "") };
}

function dispatch(
  routes: MockRoute[],
  path: string,
  init?: RequestInit
): Response | null {
  const { path: actualPath, query } = parsePath(path);
  const method = init?.method?.toUpperCase() || "GET";

  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchRoute(route.path, actualPath);
    if (!params) continue;

    let body: Record<string, unknown> = {};
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch {
        /* ignore */
      }
    }

    const ctx: RouteContext = { params, query, body };
    const result = route.handler(ctx);
    return jsonResponse(result.data, result.status || 200);
  }

  return null;
}

// --- Public API (drop-in replacement for old mock-api.ts) ---

/** Handle a bxApi call with mock data. Returns null if unhandled. */
export function mockBxApi(path: string, init?: RequestInit): Response | null {
  return dispatch(bxRoutes, path, init);
}

/** Handle a gxApi call with mock data (auth endpoints). Returns null if unhandled. */
export function mockGxApi(path: string, init?: RequestInit): Response | null {
  return dispatch(gxRoutes, path, init);
}

/** Get all registered bxApi routes (useful for documentation/debugging) */
export function getBxRoutes(): MockRoute[] {
  return bxRoutes;
}

/** Get all registered gxApi routes */
export function getGxRoutes(): MockRoute[] {
  return gxRoutes;
}
