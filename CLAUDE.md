# Built at GrowthX - Project Guide

## Overview
A Next.js 14 (App Router) platform showcasing projects built by the GrowthX community. Features project listing, voting, comments, builder leaderboard, and city stats.

## Tech Stack
- **Framework**: Next.js 14 with TypeScript (App Router)
- **Styling**: Inline styles (CSS-in-JS) + Tailwind CSS (configured but barely used)
- **Fonts**: Newsreader (serif), DM Sans (sans), DM Mono (mono) via Google Fonts
- **Database**: MongoDB (same instance as gx-backend, `bx_*` prefixed collections)
- **Auth**: gx-backend JWT cookies (`userToken`, HS512) — no NextAuth, no OAuth

## Key Files
- `src/app/page.tsx` - Main homepage (all tabs + detail view + modals, ~1660 lines)
- `src/app/projects/[id]/page.tsx` - Project detail page (standalone route)
- `src/lib/auth.ts` - JWT verification (reads `userToken` cookie, verifies HS512, looks up user in MongoDB)
- `src/lib/db.ts` - MongoDB collection helpers for `bx_*` collections + seed script
- `src/lib/mongodb.ts` - MongoDB connection with pooling
- `src/lib/store.ts` - LEGACY in-memory store (to be deleted after full migration verified)
- `src/lib/seed-data.ts` - Seed data for development
- `src/types/index.ts` - All TypeScript types, color constants (C), roles, emojis, stack metadata
- `src/app/api/` - API routes (auth, projects, votes, comments, building, members, cities, threads)

## Architecture
- **Auth**: gx-backend issues JWT via OTP/password login → sets `userToken` httpOnly cookie → our app verifies it using shared `JWT_SECRET` → looks up user in gx-backend's `users` collection
- **Data**: MongoDB collections with `bx_` prefix (bx_projects, bx_votes, bx_comments, bx_building, bx_threads, bx_cities). Reads from gx-backend's `users` collection (read-only).
- **Frontend**: Homepage renders everything client-side (single "use client" component). Project detail view exists both inline in homepage (via state) AND as separate route.
- All inline components: Av, Badge, CompanyTag, Reactions, Thread, BuilderCycler, StatusDot
- 8 component files in `src/components/` are ALL unused dead code (to be cleaned up)

## API Routes
- `GET /api/auth/me` - Verify JWT cookie, return user profile from DB (or null)
- `GET/POST /api/projects` - List/create projects (POST requires auth)
- `GET /api/projects/[id]` - Single project
- `POST /api/votes` - Toggle vote (requires auth)
- `GET/POST /api/comments` - List/add comments (POST requires auth)
- `GET /api/building` - In-progress projects
- `GET /api/members` - Builder leaderboard
- `GET /api/cities` - City stats
- `GET /api/threads` - Discussion threads

## Environment Variables
```env
MONGODB_URI=<gx-backend DB_STRING>
MONGODB_DB=<gx-backend database name>
JWT_SECRET=<gx-backend JWT_SECRET>
NEXT_PUBLIC_GX_LOGIN_URL=https://growthx.club/login
```

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run lint` - ESLint

## Color System
Warm palette defined in `src/types/index.ts` as `C` object:
- bg: #F8F7F4, surface: #FFFFFF, text: #181710
- accent: #181710, gold: #B8962E, green: #2D7A3F, blue: #2255CC

## Production Status
See `PRODUCTION_TASKS.md` for the full task tracker.
See `BACKEND_CHANGES.md` for detailed backend change spec.
See `PRODUCTION_AUDIT.md` for the original audit.
