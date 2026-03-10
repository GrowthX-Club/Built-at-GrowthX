# Contributing to Built at GrowthX

Thanks for contributing! This guide explains how to add features — including features that need backend changes — without needing access to the backend.

## Quick Setup

```bash
git clone https://github.com/GrowthX-Club/Built-at-GrowthX.git
cd Built-at-GrowthX
cp .env.example .env.local    # mock mode on by default
npm install
npm run dev
```

Open http://localhost:3000 — the full app runs with seed data.

## How Contributions Work

The backend (`gx-backend`) is private. But you can still build **any feature** — including ones that need new API endpoints. Here's how:

### The Contract-First Approach

Your PR includes three things:

1. **TypeScript types** — data shapes for your feature (`src/types/index.ts`)
2. **Mock handler** — a working mock endpoint (`src/lib/mock-api/your-feature.ts`)
3. **Frontend code** — UI that works against the mock

The mock handler IS the backend specification. The maintainers implement the real endpoint to match your mock's contract.

```
You (contributor)                    Maintainer (backend)
────────────────────────────────────────────────────────
1. Define types
2. Write mock handler + seed data
3. Build the frontend
4. Open PR against `dev`
                                     5. Review your API contract
                                     6. Merge your PR (works in mock mode)
                                     7. Implement real backend endpoint
                                     8. Ship to production
```

## Step-by-Step: Adding a Feature

Let's say you want to add **"Bookmark Projects"**.

### Step 1: Define Types

Add your new types to `src/types/index.ts`:

```typescript
export interface Bookmark {
  projectId: string;
  createdAt: string;
}
```

### Step 2: Create a Mock Handler

Create a new file `src/lib/mock-api/bookmarks.ts`:

```typescript
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/bookmarks",
    description: "List the authenticated user's bookmarked projects",
    auth: true,
    handler: () =>
      ok({
        bookmarks: [
          { projectId: "1", createdAt: "2026-02-15T10:00:00Z" },
          { projectId: "3", createdAt: "2026-02-14T08:30:00Z" },
        ],
      }),
  },

  {
    method: "POST",
    path: "/bookmarks",
    description: "Toggle bookmark on a project. Body: { projectId }",
    auth: true,
    handler: ({ body }) =>
      ok({ success: true, bookmarked: true, projectId: body.projectId }),
  },
];

export default routes;
```

### Step 3: Register Your Routes

Add your import to `src/lib/mock-api/index.ts`:

```typescript
import bookmarkRoutes from "./bookmarks";

// Add to the bxRoutes array:
const bxRoutes: MockRoute[] = [
  ...bxAuthRoutes,
  ...projectRoutes,
  // ... existing routes ...
  ...bookmarkRoutes,  // <-- your new routes
];
```

### Step 4: Add Seed Data (Optional)

If your feature needs richer mock data, add it to `src/lib/seed-data.ts`:

```typescript
export const seedBookmarks: Bookmark[] = [
  { projectId: "1", createdAt: "2026-02-15T10:00:00Z" },
  { projectId: "3", createdAt: "2026-02-14T08:30:00Z" },
];
```

Then import and use it in your mock handler.

### Step 5: Build the Frontend

Use `bxApi()` from `src/lib/api.ts` to call your new endpoints — they'll be intercepted by your mock handler:

```typescript
import { bxApi } from "@/lib/api";

// Fetch bookmarks
const res = await bxApi("/bookmarks");
const { bookmarks } = await res.json();

// Toggle bookmark
await bxApi("/bookmarks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ projectId: "1" }),
});
```

### Step 6: Open a PR

Open a pull request against the **`dev`** branch. Use the PR template — it has a section for your API contract.

## Mock Handler Reference

Each mock handler file exports a `MockRoute[]` array. Each route has:

| Field | Type | Description |
|---|---|---|
| `method` | `GET \| POST \| PUT \| DELETE` | HTTP method |
| `path` | `string` | Route pattern. Use `:param` for dynamic segments (e.g. `/projects/:id`) |
| `description` | `string` | What this endpoint does (one line — this becomes the backend spec) |
| `auth` | `boolean` | Whether the endpoint requires authentication |
| `handler` | `(ctx) => MockResponse` | The mock implementation |

The handler receives a `RouteContext`:

```typescript
interface RouteContext {
  params: Record<string, string>;  // URL params (e.g. { id: "123" })
  query: URLSearchParams;          // Query string params
  body: Record<string, unknown>;   // Parsed JSON body (POST/PUT)
}
```

Use `ok(data)` for success responses and `err(status, message)` for errors:

```typescript
import { ok, err } from "./types";

handler: ({ body }) => {
  if (!body.projectId) return err(400, "projectId is required");
  return ok({ success: true });
}
```

## Project Structure

```
src/lib/mock-api/
├── index.ts        # Router — imports and registers all handlers
├── types.ts        # MockRoute type + ok/err helpers
├── projects.ts     # Project CRUD endpoints
├── votes.ts        # Voting endpoints
├── comments.ts     # Comment + reaction endpoints
├── building.ts     # In-progress projects
├── members.ts      # Leaderboard + user search
├── cities.ts       # City stats
├── threads.ts      # Discussion threads
├── api-keys.ts     # API key management
├── auth.ts         # Login/logout/OTP flow
└── bookmarks.ts    # <-- your new feature goes here
```

## Guidelines

### Code Style
- Use inline styles (the existing pattern) — not Tailwind classes
- Use color constants from `C` and typography from `T` in `src/types/index.ts`
- Keep the warm, editorial design language (serif headings, monospace numbers)

### PR Rules
- Target the **`dev`** branch (not `main`)
- Run `npm run build` before submitting — it must pass
- Don't commit `.env.local` or credentials
- One feature per PR — keep it focused

### What Makes a Good Mock Handler
- **Realistic seed data** — use Indian names, companies, cities consistent with existing seed data
- **Cover edge cases** — return empty arrays for "no results", handle missing params
- **Document the contract** — the `description` field should tell the backend team exactly what to build
- **Mark auth correctly** — set `auth: true` if the real endpoint would need a logged-in user

## Types of Contributions

| Type | Backend needed? | What to do |
|---|---|---|
| UI polish, responsive fixes | No | Just change frontend code |
| Dark mode, animations | No | Just change frontend code |
| New feature (bookmarks, notifications, etc.) | Yes | Use the contract-first approach above |
| Bug fix in mock behavior | No | Fix the mock handler |
| New seed data | No | Add to `src/lib/seed-data.ts` |

## Getting Help

- Open an issue if you're unsure whether your feature needs backend changes
- Tag issues with `needs-discussion` if the API contract isn't obvious
- Check existing mock handlers in `src/lib/mock-api/` for patterns to follow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
