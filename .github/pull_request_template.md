## What does this PR do?

<!-- One sentence describing the change -->

## Type

<!-- Check one -->
- [ ] UI only (no backend changes needed)
- [ ] New feature (includes API contract for backend)
- [ ] Bug fix
- [ ] Refactor / cleanup

## API Contract (if applicable)

<!-- If your PR adds or changes mock handlers, fill this out. Skip for UI-only changes. -->

### New/Changed Endpoints

<!-- List each endpoint your mock handler defines -->
<!-- Example:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /bookmarks | Yes | List user's bookmarked projects |
| POST | /bookmarks | Yes | Toggle bookmark. Body: { projectId } |
-->

### New Types

<!-- List any types you added to src/types/index.ts -->
<!-- Example: `Bookmark { projectId: string; createdAt: string }` -->

### Mock Handler File

<!-- Which file in src/lib/mock-api/ did you add/modify? -->

## Screenshots / Recording

<!-- Attach a screenshot or screen recording showing the feature working in mock mode -->

## Checklist

- [ ] Targets the `dev` branch
- [ ] `npm run build` passes locally
- [ ] Tested in mock mode (`NEXT_PUBLIC_MOCK_MODE=true`)
- [ ] Mock handler has realistic seed data
- [ ] No `.env.local` or credentials committed
