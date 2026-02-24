<!-- @features built-at-growthx @apps backend @models bx_project bx_vote bx_comment bx_reaction bx_thread bx_city -->

# Feature: Built-at-GrowthX (BX)

Built-at-GrowthX is a community builder showcase platform where GrowthX members submit projects, vote on them, comment with emoji reactions, and track builder activity across cities. Projects have a lifecycle status (`shipped`, `idea`, `prototyping`, `beta`) that unifies both launched products and in-progress buildings into a single model. All read endpoints are publicly accessible; write operations require authentication.

## Summary

The BX module provides:

- **Projects** — Members submit projects with collaborators. Projects are voted on and ranked by weighted votes. The `status` field distinguishes shipped products from in-progress buildings (idea/prototyping/beta).
- **Voting** — Authenticated toggle-vote system with weighted scoring. Vote counts are denormalized onto the project for efficient sorting.
- **Comments** — Threaded comments on projects with author populated from User. Reactions stored in a separate `BxReaction` collection for independent querying and simple updates.
- **Threads** — Community discussion threads with nested replies and embedded reaction counters.
- **Members** — Aggregated builder leaderboard derived from project data, with reputation scores based on total weighted votes.
- **Cities** — Pre-seeded city data tracking builder counts and shipped project counts.

## API Endpoints

All routes are mounted at `/api/v1/bx/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/projects` | `validateUserAndAnonymous` | List projects with pagination, optional status/category filter. Returns `votedProjectIds` for logged-in users. |
| `POST` | `/projects` | `validateUser` | Create a new project. |
| `GET` | `/projects/:id` | None | Get a single project by ID with populated creator/collabs. |
| `GET` | `/my-projects` | `validateUser` | List current user's projects. |
| `PUT` | `/projects/:id` | `validateUser` | Update a project (creator only). |
| `POST` | `/votes` | `validateUser` | Toggle vote on a project. Recalculates denormalized vote counts. |
| `GET` | `/comments` | `validateUserAndAnonymous` | List comments for a project with pagination. Reactions aggregated from `BxReaction` collection. |
| `POST` | `/comments` | `validateUser` | Create a comment on a project. |
| `POST` | `/comments/:id/react` | `validateUser` | Toggle an emoji reaction on a comment. |
| `GET` | `/building` | None | List projects with non-shipped status (idea/prototyping/beta). |
| `GET` | `/members` | None | Paginated builder leaderboard sorted by reputation. |
| `GET` | `/cities` | None | List cities sorted by builder count. |
| `GET` | `/threads` | None | List community threads sorted by newest. |
| `GET` | `/users/search` | `validateUser` | Search users for collaborator typeahead. |
| `GET` | `/me` | `validateUserAndAnonymous` | Get current user profile info. |
| `POST` | `/logout` | None | Clear auth cookies. |

## Data Models

### BxProject

Unified model for both shipped projects and in-progress buildings.

```typescript
interface IBxProject {
  _id: ObjectId;
  name: string;                    // Project name (max 100 chars)
  tagline: string;                 // Short tagline (max 200 chars)
  description: string;             // Full description (max 2000 chars)
  creator: ObjectId;               // Ref: User — populated when fetching
  collabs: ObjectId[];             // Ref: User[] — populated when fetching
  weighted_votes: number;          // Denormalized from BxVote
  raw_votes: number;               // Denormalized from BxVote
  category: string;                // e.g. "SaaS", "Fintech", "Marketplace"
  stack: string[];                 // Tech stack tags
  buildathon: string | null;       // Buildathon name if applicable
  url: string | null;              // Project URL
  hero_color: string;              // Brand color hex
  featured: boolean;
  date: string;
  gallery: IBxProjectGalleryItem[];
  status: BxProjectStatus;         // 'shipped' | 'idea' | 'prototyping' | 'beta'
  watchers: number;                // For building-status projects
  log: string;                     // Latest build log entry
  log_date: string;                // When log was last updated
  help: string | null;             // Help request text
}
```

**Indexes:** `{ weighted_votes: -1 }`, `{ creator: 1 }`, `{ status: 1 }`

### BxVote

One document per user per project. Unique compound index prevents double-voting.

```typescript
interface IBxVote {
  user: ObjectId;      // Ref: User
  project: ObjectId;   // Ref: BxProject
  weight: number;      // Vote weight (default 1)
}
```

**Indexes:** `{ user: 1, project: 1 }` (unique), `{ project: 1 }`, `{ user: 1 }`

### BxComment

Simplified comment model. Author populated from User at query time. Reactions stored in separate `BxReaction` collection.

```typescript
interface IBxComment {
  project_id: ObjectId;           // Ref: BxProject
  author: ObjectId;               // Ref: User — populated when fetching
  content: string;
  parent_id: ObjectId | null;     // Ref: BxComment — for threaded replies
}
```

**Indexes:** `{ project_id: 1, created_at: 1 }`

### BxReaction

Standalone reaction collection. Each document = one user's reaction on one target. Supports comments, threads, and replies.

```typescript
enum BxReactionTargetType {
  COMMENT = 'comment',
  THREAD = 'thread',
  REPLY = 'reply',
}

interface IBxReaction {
  target_type: BxReactionTargetType;
  target_id: ObjectId;             // ID of the comment/thread/reply
  user: ObjectId;                  // Ref: User
  emoji_code: string;              // e.g. "ship_it", "fire", "love"
  emoji_display: string;           // Display character
  emoji_label: string;             // Human-readable label
  emoji_special: boolean;          // Special emoji flag (builder_approved, growthx)
}
```

**Indexes:** `{ target_type: 1, target_id: 1 }`, `{ target_type: 1, target_id: 1, user: 1, emoji_code: 1 }` (unique)

### BxThread

Community discussion thread with embedded replies and reaction counters.

```typescript
interface IBxThread {
  author: IBxThreadAuthor;         // Denormalized: { name, avatar, role, rep, title, company, company_color }
  content: string;
  time: string;
  reactions: IBxThreadReaction[];   // Embedded: { emoji_code, emoji_display, emoji_label, emoji_special, count }
  replies: IBxThreadReply[];        // Embedded subdocuments with own author + reactions
}
```

**Indexes:** `{ created_at: -1 }`

### BxCity

Pre-seeded city data for the cities leaderboard.

```typescript
interface IBxCity {
  name: string;
  builders: number;
  shipped: number;
  flag: string;
  trend: string;
}
```

**Indexes:** `{ builders: -1 }`

## Code Index

### `apps/backend` — Routes & Validation

| File | Purpose |
|------|---------|
| `routes/bx/index.ts` | All BX API route handlers. Uses `validateRequestContent` middleware, `validateUser`/`validateUserAndAnonymous` auth, pagination on list endpoints. |
| `validation/bx.ts` | Joi schemas with TypeScript interfaces: `createProject`, `updateProject`, `vote`, `createComment`, `getComments`, `reactToComment`, `listProjects`, `listMembers`. |
| `schemas/bx.ts` | Re-exports validation types for use in route handlers. |
| `scripts/seed_bx.ts` | Seed script for initial BX data (projects, threads, cities). |

### `packages/database` — Models, Schemas, CRUD

| File | Purpose |
|------|---------|
| `schemas/bx_project.ts` | `IBxProject`, `IInsertBxProject`, `IUpdateBxProject`, `IGetBxProjects`, `BxProjectStatus` enum. |
| `schemas/bx_vote.ts` | `IBxVote`, `IInsertBxVote`, `IGetBxVotes`. |
| `schemas/bx_comment.ts` | `IBxComment`, `IInsertBxComment`, `IGetBxComments`. |
| `schemas/bx_reaction.ts` | `IBxReaction`, `IInsertBxReaction`, `IGetBxReactions`, `BxReactionTargetType` enum. |
| `schemas/bx_thread.ts` | `IBxThread`, `IInsertBxThread`, `IBxThreadAuthor`, `IBxThreadReply`, `IBxThreadReaction`. |
| `schemas/bx_city.ts` | `IBxCity`. |
| `models/bx_project.ts` | Mongoose model with status field, collabs as ObjectId refs, building fields. |
| `models/bx_vote.ts` | Mongoose model with unique compound index on `{ user, project }`. |
| `models/bx_comment.ts` | Mongoose model with author as ObjectId ref. No embedded reactions. |
| `models/bx_reaction.ts` | Mongoose model with unique compound index on `{ target_type, target_id, user, emoji_code }`. |
| `models/bx_thread.ts` | Mongoose model with unified reaction field names (`emoji_code`, `emoji_display`, etc.). |
| `models/bx_city.ts` | Mongoose model for pre-seeded city data. |
| `crud/bx_project.ts` | `bxProjectCRUDService` — extends `BaseCRUDService`. |
| `crud/bx_vote.ts` | `bxVoteCRUDService` — extends `BaseCRUDService`. |
| `crud/bx_comment.ts` | `bxCommentCRUDService` — extends `BaseCRUDService`. |
| `crud/bx_reaction.ts` | `bxReactionCRUDService` — extends `BaseCRUDService`. |
| `crud/bx_thread.ts` | `bxThreadCRUDService` — extends `BaseCRUDService`. |
| `crud/bx_city.ts` | `bxCityCRUDService` — extends `BaseCRUDService`. |

## Key Concepts

### Unified Project + Building Model

Projects and buildings were merged into a single `BxProject` model differentiated by the `status` field:

- `shipped` — launched products, shown on the main projects page.
- `idea` / `prototyping` / `beta` — in-progress buildings, shown on the `/building` page.

Building-specific fields (`watchers`, `log`, `log_date`, `help`) are optional and only relevant for non-shipped statuses.

### Reactions as a Sibling Collection

Reactions are stored in a standalone `BxReaction` collection instead of being embedded in comments or threads. This design:

- Makes reactions independently queryable and filterable.
- Simplifies reaction toggle operations (insert/delete instead of array manipulation).
- Uses a compound unique index to prevent duplicate reactions.
- Aggregates reaction counts at query time by grouping on `emoji_code`.

Thread reactions remain embedded (as counters) since threads are a simpler discussion model.

### Creator + Collabs via Population

Projects store `creator` and `collabs` as ObjectId references to the User model. User profile data (name, avatar, company, role) is fetched via Mongoose `populate` at query time rather than denormalized snapshots. This ensures profile data stays current and avoids schema duplication.

### Vote Denormalization

When a vote is toggled, the route recalculates `raw_votes` and `weighted_votes` on the project document. This allows sorting projects by votes without joining the `BxVote` collection.

### Validation Pattern

All routes use the `validateRequestContent` middleware (from `apps/backend/middleware/validation.ts`) for request validation, following the project convention of auth -> validation -> handler middleware ordering. Joi schemas are typed with TypeScript generics (`joi.object<T>`).

## Recent Changes

- 2026-02-24: Initial implementation of Built-at-GrowthX module. Merged BxBuilding into BxProject with status field. Created BxReaction as standalone collection. Simplified BxComment to use author ObjectId ref (no denormalized fields). Unified reaction field names across thread and comment schemas. Added pagination to list endpoints. Used `validateRequestContent` middleware and `...validateUser()` spread pattern. Batch user fetching for members endpoint. Split avatar into `avatar_url` + `initials`. Files: `apps/backend/routes/bx/index.ts`, `apps/backend/validation/bx.ts`, `apps/backend/schemas/bx.ts`, `apps/backend/scripts/seed_bx.ts`, `packages/database/schemas/bx_project.ts`, `packages/database/schemas/bx_vote.ts`, `packages/database/schemas/bx_comment.ts`, `packages/database/schemas/bx_reaction.ts`, `packages/database/schemas/bx_thread.ts`, `packages/database/schemas/bx_city.ts`, `packages/database/models/bx_project.ts`, `packages/database/models/bx_vote.ts`, `packages/database/models/bx_comment.ts`, `packages/database/models/bx_reaction.ts`, `packages/database/models/bx_thread.ts`, `packages/database/models/bx_city.ts`, `packages/database/crud/bx_project.ts`, `packages/database/crud/bx_vote.ts`, `packages/database/crud/bx_comment.ts`, `packages/database/crud/bx_reaction.ts`, `packages/database/crud/bx_thread.ts`, `packages/database/crud/bx_city.ts` — @features built-at-growthx
