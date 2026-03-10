# Built at GrowthX

Discover what the GrowthX community is shipping. A showcase platform for products built at buildathons, cohort programs, and independently by GrowthX members.

**Live:** [builtat.growthx.club](https://builtat.growthx.club)

## Quick Start (Contributors)

No backend access needed. The app runs entirely on mock data.

```bash
# 1. Clone the repo
git clone https://github.com/GrowthX-Club/Built-at-GrowthX.git
cd Built-at-GrowthX

# 2. Set up environment
cp .env.example .env.local

# 3. Install and run
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the full app running with seed data.

Mock mode is enabled by default in `.env.example` (`NEXT_PUBLIC_MOCK_MODE=true`). This serves fake projects, builders, cities, and threads so you can work on any part of the UI without needing database credentials or the backend API.

### What works in mock mode

- Browsing all tabs (Built, Building, Builders, Cities)
- Project detail pages
- Voting (client-side only, resets on refresh)
- Submit project modal
- Leaderboard and city stats

### What doesn't work in mock mode

- Real authentication (a mock user is auto-logged-in)
- Persisted votes, comments, or new projects
- User search returns matches from seed builders only

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Inline styles + Tailwind CSS
- **Fonts:** Newsreader (serif), DM Sans (body), DM Mono (mono)
- **Backend:** External API (`gx-backend`) — not needed for local dev

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Homepage (Built tab, main entry)
│   ├── projects/           # /projects listing + /projects/[id] detail
│   ├── builders/           # Leaderboard page
│   ├── building/           # Work-in-progress projects
│   ├── cities/             # City stats
│   ├── my-projects/        # User's own projects (auth required)
│   ├── settings/           # API keys management
│   └── layout.tsx          # Root layout, fonts, providers
├── components/             # Shared components (Nav, LoginDialog, etc.)
├── lib/
│   ├── api.ts              # API client (auto-switches to mock in dev)
│   ├── mock-api/           # Mock handlers — one file per feature domain
│   │   ├── index.ts        # Router (registers all handlers)
│   │   ├── types.ts        # MockRoute type definition
│   │   ├── projects.ts     # Project CRUD
│   │   ├── votes.ts        # Voting
│   │   ├── comments.ts     # Comments + reactions
│   │   └── ...             # More domains
│   └── seed-data.ts        # Seed data (projects, builders, cities, threads)
├── types/
│   └── index.ts            # All TypeScript types, color system, normalizers
├── context/                # React context providers
└── hooks/                  # Custom hooks
```

## Contributing

**Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.**

The short version:

1. Fork the repo and create a branch from `dev`
2. `cp .env.example .env.local` (mock mode on by default)
3. Make your changes — for features needing backend, use the **contract-first** approach (add types + mock handler + frontend)
4. Test with `npm run dev`, verify with `npm run build`
5. Open a PR against **`dev`** (not `main`)

### Want to add a feature that needs backend changes?

You don't need backend access. Create a mock handler file in `src/lib/mock-api/` that defines the API contract, build your frontend against it, and submit a PR. The maintainers implement the real backend to match your contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the step-by-step guide.

### Good first issues

Look for issues tagged [`good first issue`](https://github.com/GrowthX-Club/Built-at-GrowthX/labels/good%20first%20issue) or pick from:

- UI polish and responsive improvements
- Accessibility fixes
- New badge/tag designs
- Animation refinements
- Dark mode enhancements

### Guidelines

- Keep the warm, editorial design language (serif headings, monospace numbers, `#F8F7F4` background)
- Use inline styles for components — that's the existing pattern
- Color constants are in `src/types/index.ts` as the `C` object — use them instead of hardcoding colors
- Typography scale is in `src/types/index.ts` as the `T` object
- Don't commit `.env.local` or any credentials

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_MOCK_MODE` | No | `false` | Set to `true` to use seed data instead of backend API |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000/api/v1` | Backend API URL (only when mock mode is off) |
| `NEXT_PUBLIC_GX_LOGIN_URL` | No | — | GrowthX login page URL (only when mock mode is off) |

## For Team Members

If you have backend access, set `NEXT_PUBLIC_MOCK_MODE=false` (or remove it) in `.env.local` and configure `NEXT_PUBLIC_API_URL` to point to the running gx-backend instance.

See [BACKEND_GUIDE.md](BACKEND_GUIDE.md) for how to implement contributor API contracts in gx-backend.

## License

This project is open source under the [MIT License](LICENSE).
