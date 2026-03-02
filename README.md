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
│   ├── mock-api.ts         # Mock responses from seed data
│   └── seed-data.ts        # Seed data (projects, builders, cities, threads)
├── types/
│   └── index.ts            # All TypeScript types, color system, normalizers
├── context/                # React context providers
└── hooks/                  # Custom hooks
```

## Contributing

1. Fork the repo and create your branch from `main`
2. `cp .env.example .env.local` (mock mode is on by default)
3. Make your changes
4. Test locally with `npm run dev`
5. Run `npm run build` to verify there are no build errors
6. Open a pull request against `main`

### Guidelines

- Keep the warm, editorial design language (serif headings, monospace numbers, `#F8F7F4` background)
- Use inline styles for components — that's the existing pattern
- Color constants are in `src/types/index.ts` as the `C` object — use them instead of hardcoding colors
- Typography scale is in `src/types/index.ts` as the `T` object
- Don't commit `.env.local` or any credentials

### Good first issues

Look for issues tagged [`good first issue`](https://github.com/GrowthX-Club/Built-at-GrowthX/labels/good%20first%20issue) or pick from:

- UI polish and responsive improvements
- Accessibility fixes
- New badge/tag designs
- Animation refinements
- Dark mode enhancements

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_MOCK_MODE` | No | `false` | Set to `true` to use seed data instead of backend API |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000/api/v1` | Backend API URL (only when mock mode is off) |
| `NEXT_PUBLIC_GX_LOGIN_URL` | No | — | GrowthX login page URL (only when mock mode is off) |

## For Team Members

If you have backend access, set `NEXT_PUBLIC_MOCK_MODE=false` (or remove it) in `.env.local` and configure `NEXT_PUBLIC_API_URL` to point to the running gx-backend instance.

## License

This project is open source under the [MIT License](LICENSE).
