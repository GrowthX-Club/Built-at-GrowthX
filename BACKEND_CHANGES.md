# Backend Changes Required

## Draft Mode + Build Process + Required URL

### New Fields on `bx_projects` Collection

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isDraft` | Boolean | `false` | Whether the project is in draft mode (not publicly visible) |
| `buildProcess` | String (Lexical JSON) | `""` | Rich text describing how the project was built |

### API Changes

#### POST `/api/v1/bx/projects` (Create Project)
- Accept new fields: `buildProcess` (string), `isDraft` (boolean)
- If `isDraft` is `true`, allow submission without `url`
- If `isDraft` is `false` (or not provided), `url` is **required** — return 400 if missing

#### GET `/api/v1/bx/projects` (List Projects)
- Filter out `isDraft: true` projects from the default listing
- Add optional query param `?includeDrafts=true` to include draft projects (for owner views)
- When `includeDrafts=true`, only return drafts belonging to the authenticated user

#### GET `/api/v1/bx/projects/:id` (Single Project)
- Return draft projects only if the requester is the project owner
- Non-owners should get 404 for draft projects

#### PUT `/api/v1/bx/projects/:id` (Update Project)
- Allow updating `isDraft` field (to publish a draft: set `isDraft: false`)
- When setting `isDraft: false`, validate that `url` is present

### Migration Script

Run once to set all existing projects without URLs to draft:

```javascript
db.bx_projects.updateMany(
  { $or: [{ url: { $exists: false } }, { url: null }, { url: "" }] },
  { $set: { isDraft: true } }
);

// Ensure all existing projects with URLs are explicitly non-draft
db.bx_projects.updateMany(
  { url: { $exists: true, $ne: null, $ne: "" }, isDraft: { $exists: false } },
  { $set: { isDraft: false } }
);
```
