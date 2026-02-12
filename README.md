# Built at GrowthX

A Product Hunt-style platform where GrowthX community members showcase products they build at buildathons, cohort programs, or independently. The community votes with weighted influence based on role.

## Tech Stack

- **Framework**: Next.js 14 (App Router), React Server Components
- **Styling**: Tailwind CSS
- **Database**: MongoDB (in-memory store with seed data for development)
- **Fonts**: DM Sans (body), JetBrains Mono (numbers/scores)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

The app comes pre-seeded with mock data (15 projects, 12 members, 7 events) so it's functional immediately.

## Features (Phase 1)

- **Project Listings**: Browse projects with weighted scores, search, and sort by trending/newest
- **Project Details**: Full descriptions, build logs, team profiles, vote breakdowns, and comments
- **Weighted Voting**: Role-based vote multipliers (builder 5x, host 4x, founder 3x, member 2x, non-member 1x)
- **Events**: Browse buildathons, cohorts, and community events. Projects can optionally belong to events
- **Builder Leaderboard**: Reputation rankings with time filters
- **City Leaderboard**: Cross-city rankings with score bars
- **Timeline**: Weekly project submission bar chart
- **Member Profiles**: All shipped projects, builder score, role tags
- **Submit Flow**: Project submission with team tagging and event selection
- **Auth**: Demo auth with member selection (production: GrowthX SSO)
- **Comments**: Threaded feedback on projects

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes (projects, votes, comments, events, members, etc.)
    projects/[id]/        # Project detail page
    events/               # Events grid
    builders/             # Builder leaderboard
    cities/               # City leaderboard
    timeline/             # Weekly submission chart
    members/[id]/         # Member profile
  components/             # Reusable UI components
  lib/                    # Data store, MongoDB client, auth, seed data
  types/                  # TypeScript types and constants
```

## Data Model

- **Project** (primary entity) - can exist independently or belong to an event
- **Event** - container for buildathons, cohorts, host clubs
- **Member** - GrowthX community member with role and reputation
- **Vote** - one per member per project, weighted by role
- **Comment** - threaded feedback on projects
