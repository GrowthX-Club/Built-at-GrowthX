# Backend Implementation Guide

This guide is for the maintainer team. When a contributor submits a PR with a new feature, here's how to implement the backend for it.

## How It Works

Contributors add features using the **contract-first** approach:

1. They define TypeScript types in `src/types/index.ts`
2. They create a mock handler in `src/lib/mock-api/<feature>.ts`
3. They build the frontend against the mock

**The mock handler IS your backend spec.** Each `MockRoute` tells you exactly:
- The HTTP method and path
- Whether it needs auth
- What the request body looks like (from the handler's `body` usage)
- What the response shape is (from the `ok(...)` return value)

## When a PR Comes In

### 1. Review the API contract

Open the contributor's mock handler file. Each route looks like:

```typescript
{
  method: "POST",
  path: "/bookmarks",
  description: "Toggle bookmark on a project. Body: { projectId }",
  auth: true,
  handler: ({ body }) =>
    ok({ success: true, bookmarked: true, projectId: body.projectId }),
}
```

From this you know:
- **Endpoint:** `POST /api/v1/bx/bookmarks`
- **Auth:** Required (Bearer token)
- **Request body:** `{ projectId: string }`
- **Response:** `{ success: true, bookmarked: boolean, projectId: string }`

### 2. Check the types

Look at what they added to `src/types/index.ts` — these are the data shapes the frontend expects. Your backend response must match (after the normalizer runs).

### 3. Decide on DB schema

The contributor's types represent the **API response shape**, not the DB schema. You decide:
- Which collection to use (follow the `bx_` prefix convention)
- What indexes to create
- Whether to embed or reference other documents

### 4. Merge the frontend PR

The frontend PR works in mock mode — it's safe to merge into `dev` even before the backend is ready. When you're ready, you implement the backend, and the feature goes live.

### 5. Implement the backend

In gx-backend, create the route to match the mock contract. The path mapping is:

| Frontend calls | Backend route |
|---|---|
| `bxApi("/bookmarks")` | `POST /api/v1/bx/bookmarks` |
| `bxApi("/projects?sort=top")` | `GET /api/v1/bx/projects?sort=top` |

## Quick Reference: Existing Endpoints

These are all the mock routes currently defined. Your backend should match these contracts:

### Projects (`mock-api/projects.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /projects | No | List projects (query: limit, offset, sort) |
| GET | /projects/:id | No | Single project by ID or slug |
| POST | /projects | Yes | Create project |
| PUT | /projects/:id | Yes | Update project |
| GET | /my-projects | Yes | User's own projects |

### Votes (`mock-api/votes.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /votes | Yes | Toggle vote (body: projectId, weight?) |

### Comments (`mock-api/comments.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /comments | No | List comments (query: projectId) |
| POST | /comments | Yes | Add comment (body: projectId, content, parentId?) |
| POST | /comments/:id/react | Yes | Add reaction (body: emoji_code) |

### Building (`mock-api/building.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /building | No | In-progress projects |

### Members (`mock-api/members.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /members | No | Builder leaderboard |
| GET | /users/search | No | Search builders (query: q) |

### Cities (`mock-api/cities.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /cities | No | City stats |

### Threads (`mock-api/threads.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /threads | No | Discussion threads |

### API Keys (`mock-api/api-keys.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api-keys | Yes | List user's API keys |
| POST | /api-keys | Yes | Create API key |
| DELETE | /api-keys/:id | Yes | Revoke API key |

### Auth (`mock-api/auth.ts`)
| Method | Path | Auth | API | Description |
|--------|------|------|-----|-------------|
| GET | /me | No | bxApi | Current user profile |
| POST | /logout | No | bxApi | Clear session |
| POST | /cauth/send_otp | No | gxApi | Send OTP |
| POST | /cauth/login | No | gxApi | Verify OTP, get token |
| POST | /cauth/register | No | gxApi | Register user |
| POST | /cauth/retry_otp | No | gxApi | Resend OTP |

## Tips

- **Normalizers handle the translation.** The frontend has normalizer functions (in `src/types/index.ts`) that convert your backend's snake_case/nested responses into the frontend's camelCase types. If your response shape differs slightly from the mock, update the normalizer — don't fight the backend's natural shape.

- **Auth pattern.** All `auth: true` endpoints expect a Bearer token in the Authorization header. Verify with your JWT middleware and extract the user ID.

- **New collections.** Follow the `bx_` prefix: `bx_bookmarks`, `bx_notifications`, etc.

- **Test the handoff.** After implementing a backend endpoint, set `NEXT_PUBLIC_MOCK_MODE=false` locally and verify the contributor's frontend works against your real endpoint. If the response shape doesn't match, either adjust your backend or add/update a normalizer.
