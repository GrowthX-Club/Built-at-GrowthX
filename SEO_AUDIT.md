# SEO Audit Report — Built at GrowthX

**Date:** 2026-03-05
**Scope:** Full codebase analysis — what to change and add for SEO

---

## Executive Summary

The site has **critical SEO gaps** that make it nearly invisible to search engines. The biggest issue: **both the homepage and project detail pages are fully client-rendered** (`"use client"`), meaning Google sees an empty shell with no project content. Below are the prioritized recommendations.

---

## CRITICAL Issues (Fix First)

### 1. Homepage is 100% Client-Rendered — No Indexable Content

**File:** `src/app/page.tsx` (line 1: `"use client"`)

The entire homepage (~1660 lines) is a client component. All project data is fetched via `useEffect` → API calls. Search engine crawlers see:
- A title ("Built at GrowthX")
- A description ("Discover what the GrowthX community is shipping")
- **Zero project content, zero project names, zero builder names**

**Recommendation:** Convert the homepage to a **server component** that fetches project data server-side and passes it to client interactive components. The project list, titles, descriptions, and builder names must be in the initial HTML.

**What to change:**
- Split `src/app/page.tsx` into a server component wrapper that fetches data + client interactive components
- The server component should do `await db.collection('bx_projects').find(...)` directly
- Pass pre-fetched data as props to the client components
- Keep interactivity (voting, modals, tabs) in `"use client"` child components

---

### 2. Project Detail Page is 100% Client-Rendered — No Dynamic Metadata

**File:** `src/app/projects/[id]/page.tsx` (line 1: `"use client"`)

Each project page (`/projects/[id]`) fetches everything client-side. There is:
- No `generateMetadata()` — every project page has the same generic title
- No `generateStaticParams()` — no pre-rendering of popular projects
- No server-side data fetching — crawlers see empty content

**Recommendation:**
- Add a **server component wrapper** or convert to server component with client islands
- Add `generateMetadata()` to produce unique `<title>`, `<meta description>`, and OpenGraph tags per project
- Optionally add `generateStaticParams()` for ISR of top projects

**What to add** (new file or refactor existing):
```ts
// src/app/projects/[id]/page.tsx (server component)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject(params.id);
  return {
    title: `${project.name} — Built at GrowthX`,
    description: project.tagline,
    openGraph: {
      title: project.name,
      description: project.tagline,
      images: [project.icon || '/built-logo.svg'],
    },
  };
}
```

---

### 3. No robots.txt

**Missing file:** `src/app/robots.ts` (or `public/robots.txt`)

Without this, crawlers have no guidance. Some crawlers may skip the site entirely.

**What to add:**
```ts
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/settings', '/my-projects', '/login'] },
    sitemap: 'https://built.growthx.club/sitemap.xml', // adjust domain
  };
}
```

---

### 4. No sitemap.xml

**Missing file:** `src/app/sitemap.ts`

Search engines have no way to discover project pages. With potentially hundreds of projects, this is a significant missed opportunity.

**What to add:**
```ts
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getCollection } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await (await getCollection('projects')).find({}).toArray();

  const projectUrls = projects.map((p) => ({
    url: `https://built.growthx.club/projects/${p._id}`,
    lastModified: p.updatedAt || p.createdAt,
    priority: 0.8,
  }));

  return [
    { url: 'https://built.growthx.club', lastModified: new Date(), priority: 1.0 },
    { url: 'https://built.growthx.club/builders', priority: 0.7 },
    { url: 'https://built.growthx.club/cities', priority: 0.5 },
    ...projectUrls,
  ];
}
```

---

## HIGH Priority Issues

### 5. No OpenGraph / Twitter Card Metadata

**File:** `src/app/layout.tsx` (lines 11-14)

Current metadata is bare minimum:
```ts
export const metadata: Metadata = {
  title: "Built at GrowthX",
  description: "Discover what the GrowthX community is shipping",
};
```

Missing: `metadataBase`, `openGraph`, `twitter`, `icons`, `keywords`, `alternates`.

**What to change in `src/app/layout.tsx`:**
```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://built.growthx.club'),
  title: {
    default: 'Built at GrowthX',
    template: '%s — Built at GrowthX',
  },
  description: 'Discover what the GrowthX community is shipping — projects, builders, and city stats from India\'s top product community.',
  openGraph: {
    type: 'website',
    siteName: 'Built at GrowthX',
    title: 'Built at GrowthX',
    description: 'Discover what the GrowthX community is shipping',
    images: ['/built-logo.svg'],  // ideally a 1200x630 OG image
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Built at GrowthX',
    description: 'Discover what the GrowthX community is shipping',
  },
  icons: {
    icon: '/built-logo.svg',
    apple: '/built-logo.svg',  // should be a PNG
  },
};
```

---

### 6. No Structured Data (JSON-LD)

No schema.org markup anywhere in the codebase. This means no rich results in Google (no project cards, no organization info, no breadcrumbs).

**What to add:**

**a) Organization schema in layout.tsx:**
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GrowthX',
  url: 'https://growthx.club',
  logo: 'https://built.growthx.club/built-logo.svg',
}) }} />
```

**b) Per-project SoftwareApplication or CreativeWork schema** in the project detail page (server component):
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: project.name,
  description: project.tagline,
  author: { '@type': 'Person', name: project.builderName },
  applicationCategory: project.category,
}) }} />
```

---

### 7. No Custom 404 Page

**Missing file:** `src/app/not-found.tsx`

When users or crawlers hit a dead link, they get the default Next.js 404. A custom page with navigation and suggested projects would reduce bounce rate and help crawlers.

**What to add:** A simple `not-found.tsx` with links back to homepage and popular projects.

---

### 8. No Favicon / Apple Touch Icon (PNG)

**File:** `public/` — only contains `built-logo.svg`

Most browsers and social platforms need:
- `favicon.ico` (or favicon.png)
- `apple-touch-icon.png` (180x180)
- `og-image.png` (1200x630) for social sharing

**What to add:** Generate these from the SVG logo and place in `public/`.

---

## MEDIUM Priority Issues

### 9. Font Loading Not Optimized

**File:** `src/app/layout.tsx` (lines 29-38)

Fonts are loaded via `<link>` tags to Google Fonts. This is a render-blocking external request.

**What to change:** Use Next.js `next/font/google` instead:
```ts
import { DM_Sans, DM_Mono, Newsreader } from 'next/font/google';
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--sans' });
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--mono' });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--serif' });
```
This self-hosts fonts, eliminates the external request, and enables font-display:swap automatically.

---

### 10. Sub-pages Missing Individual Metadata

**Files:** `src/app/builders/page.tsx`, `src/app/cities/page.tsx`, `src/app/building/page.tsx`, `src/app/projects/page.tsx`

None of these pages export their own `metadata`. They all inherit the generic root metadata.

**What to add** in each file:
```ts
export const metadata: Metadata = {
  title: 'Builders',  // will become "Builders — Built at GrowthX" with template
  description: 'Top builders in the GrowthX community ranked by projects shipped.',
};
```

---

### 11. No Canonical URLs

No `alternates.canonical` is set anywhere. If the site is accessible from multiple domains/URLs, search engines may index duplicates.

**What to add in `layout.tsx`:**
```ts
alternates: {
  canonical: 'https://built.growthx.club',
},
```

And in each dynamic page via `generateMetadata`:
```ts
alternates: {
  canonical: `https://built.growthx.club/projects/${params.id}`,
},
```

---

### 12. No Error Boundary Page

**Missing file:** `src/app/error.tsx`

A custom error page prevents crawlers from seeing raw error stacks and provides recovery navigation.

---

## LOW Priority (Nice to Have)

### 13. Internal Linking Improvements
- The homepage project cards should use `<Link href="/projects/[id]">` (verify they do) so crawlers can discover project pages.
- Builder profile names could link to a builder page if one exists.

### 14. Image Alt Text Audit
- Verify all `<Image>` and `<img>` tags have descriptive `alt` attributes, not empty strings.

### 15. Semantic HTML
- Verify proper heading hierarchy (`h1` → `h2` → `h3`) on each page.
- Use `<article>` for project cards, `<nav>` for navigation, `<main>` for content areas.

### 16. URL Structure
Current URL structure is clean and good:
- `/` — homepage
- `/projects/[id]` — project detail
- `/builders` — builder leaderboard
- `/cities` — city stats
- `/building` — in-progress projects

No changes needed here.

---

## Priority Implementation Order

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| 1 | Server-render homepage project list | Critical | High |
| 2 | Server-render project detail + `generateMetadata` | Critical | Medium |
| 3 | Add `robots.ts` | Critical | Low |
| 4 | Add `sitemap.ts` | Critical | Low |
| 5 | Expand root metadata (OG, Twitter, icons) | High | Low |
| 6 | Add JSON-LD structured data | High | Low |
| 7 | Add custom `not-found.tsx` | High | Low |
| 8 | Add favicon/apple-touch-icon PNGs | High | Low |
| 9 | Switch to `next/font` | Medium | Low |
| 10 | Add per-page metadata to sub-routes | Medium | Low |
| 11 | Add canonical URLs | Medium | Low |
| 12 | Add `error.tsx` | Low | Low |

---

## What NOT to Change

- **URL structure** — already clean and SEO-friendly
- **`next.config.mjs`** — image remote patterns are fine
- **API routes** — these should stay behind `/api/` and be excluded from crawling
- **Auth flow** — SEO doesn't apply to authenticated pages like `/settings`, `/my-projects`
- **Tailwind/CSS approach** — no SEO impact
- **MongoDB schema** — no changes needed for SEO
