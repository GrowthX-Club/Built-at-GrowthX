/**
 * Mock API route definition.
 *
 * Each route acts as BOTH a working mock AND a backend contract.
 * When a contributor adds a new feature, they add a MockRoute — the backend
 * team implements the real endpoint to match this exact shape.
 */
export interface MockRoute {
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "DELETE";

  /**
   * Route path pattern. Use `:param` for dynamic segments.
   * Examples: "/projects", "/projects/:id", "/comments/:id/react"
   */
  path: string;

  /** What this endpoint does (one line) */
  description: string;

  /** Whether the endpoint requires authentication (Bearer token) */
  auth: boolean;

  /**
   * Mock handler function.
   * @param params - URL path params (e.g. { id: "123" })
   * @param query  - URL query params
   * @param body   - Parsed JSON request body (for POST/PUT)
   * @returns The response data (will be JSON-serialized)
   */
  handler: (ctx: RouteContext) => MockResponse;
}

export interface RouteContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
}

export interface MockResponse {
  status?: number;
  data: unknown;
}

/** Helper to create a successful response */
export function ok(data: unknown): MockResponse {
  return { status: 200, data };
}

/** Helper to create an error response */
export function err(status: number, message: string): MockResponse {
  return { status, data: { error: message } };
}
