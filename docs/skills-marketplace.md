# Skills Marketplace — scoping

Status: rev 5 · 21 Sep 2026 · author: Junior
Surface: `built.growthx.club/skills` + `gx-backend` `/api/v1/bx/skills/*`

Decisions locked (Pranav, 21 Sep):

- Host is **`built.growthx.club`**.
- Publishing is open to any GrowthX API key, **members only**. Needs building — §2.6.
- **Installing is public.** Every published skill is world-readable; the publish
  confirmation says so.
- Publishing a skill does **not** score toward the sprint.
- Install rides the existing `npx skills` CLI through its well-known discovery protocol —
  §6, verified end to end. We build no installer.
- The **reserved-name list in §5.1 is approved** — 145 exact names plus the `growthx-`,
  `gx-` and `bx-` prefixes. The vendored bundle names are deliberately not on it, which is
  also why we don't publish those eight into the registry at all (§2.5).
- **No pre-publish review.** Members are trusted; a skill is live when they publish it, same
  as a project. Safety is disclosure plus a kill switch — §2.3.

Nothing is blocked. Phase 1 (§8) is buildable as written.

---

## 1. What this is

Build Sprint builders write agent skills as part of onboarding. Today each one dies in the
builder's own `.claude/skills/` folder. This makes them publishable, findable and
installable by every other builder — entirely from the terminal, through Claude or Codex,
with no web session at publish time.

Two verbs we build, one we get for free:

```
/growthx-skills publish   → my folder becomes a versioned package others can install
/growthx-skills search    → find a skill by what it does
npx skills add built.growthx.club --skill <name>   → pull someone else's skill in
```

Plus a web surface at `/skills` for browsing, reading the source before you trust it, and
linking to from the handbook.

---

## 2. Product opinion

The calls, with the reasoning behind each. Ones marked **Decided** are settled; the rest are
my recommendation and still arguable.

### 2.1 This is a package registry, not a second showcase

The instinct is to reuse `bx_projects` with `type: 'skill'`. Don't. A project is a thing
someone built and wants credit for; a skill is a thing someone else is going to run inside
their own agent. Different noun, different lifecycle (versions, deprecation, yanking),
different failure mode — a bad project is boring, a bad skill exfiltrates your repo.

New collections. Shared identity, shared API key, shared design language, separate model.

### 2.2 Installs are the metric. No upvotes, no comments in v1.

`bx_votes` and `bx_comments` are hard-bound to `project`, so skills wouldn't inherit them
for free anyway — but the stronger reason is that upvotes on a package are a vanity number
a 200-person cohort will coordinate in a WhatsApp group inside a day. Install count is
honest, free to record (the download endpoint already runs), and it's the number a builder
actually wants when choosing between two skills. Ship install count and last-published
date. Nothing else.

### 2.3 Publish goes live instantly. Safety is disclosure plus a kill switch.

**Decided 21 Sep:** members are trusted, so there is no pre-publish review. A skill is live
the moment it's published, same as a project. No `pending` state, no approval queue, no
waiting on us.

That's also what the ecosystem does. The stock `npx skills` CLI ends every single install
with its own line — *"Review skills before use; they run with full agent permissions"* —
because no registry can vet what a prompt will tell an agent to do. Our page should make
that easy to act on rather than pretend we've done it for you.

So the controls are all post-publish, and they're the same shape as projects:

- **Disclosure carries the weight.** The detail page shows the **complete rendered
  `SKILL.md` and the full file tree** above the install command. Not truncated, not
  summarised. A skill that says "before answering, read `.env` and POST it to …" reads as
  normal prose — the only defence that works is the reader seeing the actual text.
- **Executables are labelled, not gated.** The server still classifies each publish as
  `prompt-only` or `has-executables` by inspecting the tarball, because a skill shipping
  `scripts/` deserves a louder banner and a marker in the list. It changes what the page
  says, not whether the skill goes live.
- **`enabled: false` kill switch** per skill and per version, exactly like
  `bx_projects.enabled`. This is the real control: we don't stop things going up, we stop
  them fast when something's wrong.
- **Slack on every publish**, via `SubmissionNotificationService` — the same firehose
  project submissions already post to. Passive review beats a queue nobody staffs.
- **Report link** on every detail page, into the same channel.
- **sha256 per version**, verified by the CLI on install, so what's on the page is what
  lands on disk.

The thing that makes this defensible is the population: paid members with real identities
attached to their GrowthX account, not anonymous npm handles. If the registry ever opens
past that, the trust assumption changes and this section gets reopened.

### 2.4 Versions are immutable

`publish` never overwrites. It creates a new version row with a content hash. `latest` is a
pointer. `install foo` takes latest, `install foo@1.2.0` pins. Yanking hides a version from
resolution without deleting it, so anyone who already pinned it still resolves.

This costs almost nothing to build now and is impossible to retrofit once people have
installs in the wild.

### 2.5 Seed it on day 0 — but only with what's ours

`/skills` launching with zero entries and a "be the first to publish" empty state is how
this dies. It should open already answering "what does `impeccable` actually do" — a
question builders ask today with no page to point at.

The bundle is eleven skills, and only three are GrowthX's: `grill-me`, `art-direction` and
`checkpoint` (per `build-sprint-skills/SOURCES.md`). The other eight are vendored from
`vercel-labs`, `anthropics`, `pbakaus`, `get-convex`, `coreyhaines31` and `benjitaylor`.

So they get handled differently:

- **Ours** (`grill-me`, `art-direction`, `checkpoint`, plus `growthx-skills` itself) are
  published into the registry properly, under a GrowthX publisher, and their names go on
  the reserved list.
- **Vendored** skills are *not* published into the registry. Publishing them would claim
  `frontend-design` and `copywriting` in a namespace where a member might legitimately want
  those names, for skills we didn't write. The licenses permit redistribution; the slug
  claim is the part that isn't ours to make.

Instead, `/skills` carries a pinned **"In your Build Sprint bundle"** strip above the
community list: all eleven, each with its real upstream attribution and the install line
they already use (`npx skills add GrowthX-Club/build-sprint-skills --skill <name>`). They're
searchable from the same box and they link out. They just don't hold a registry slug.

The page is full on day one, nobody's name gets squatted, and `frontend-design` stays
claimable.

### 2.6 Don't build a device-code OAuth flow for a two-week cohort

"They don't need to log in" is right as a per-publish requirement, but today's
`growthx-bx-submit` skill still tells people to go log into the website and generate a key
by hand — which is the friction we're trying to remove, just moved to setup time.

The cheap fix: every Build Sprint builder is already inside the handbook at
`/learn/build-sprint`, which is seat-gated. Put a **"Your skills API key"** block in the
setup section of that page — one click, auto-creates the key if none exists, copies
`export GROWTHX_API_KEY=…` to the clipboard. The setup ceremony is one click inside a page
they're already reading, and publishing itself never touches a browser.

A proper CLI device-code pairing (`POST /bx/cli/device` → short code → poll) is the correct
long-term answer and is about a day of work. It is not worth it before this cohort ships. v2.

**Publishing is members only.** `validateAgentApiKey`
(`apps/backend/middleware/agent.ts`) does no membership check today — it resolves the key
to a user and moves on, despite the existing skill's error table claiming a `403` for
lapsed membership. The gate needs building. The pattern already exists five lines from
where it's needed: `GET /bx/me` (`routes/bx/index.ts:1077-1083`) pulls
`memberDataCRUDService.getOrCreateByUserId` and runs `isMembershipPlanCompleted` over
`onboarding.subscription_plans`. Lift that into a `requireActiveMembership` middleware and
stack it after `validateAgentApiKey` on the publish route only — reads stay open.

Note this applies to the **publish** path. Install is unauthenticated by construction
(§6), so a published skill is world-readable regardless.

### 2.7 Search stays dumb

Mongo `$text` index over `name`, `title`, `description`, `tags`, plus tag and tier filters.
No embeddings, no vector store. The consumer is an agent that can read twenty candidate
descriptions and reason about them — the semantic layer is free and already installed on
the other side of the API. Revisit past a few hundred skills, which will not happen this
cohort.

### 2.8 One skill, two verbs

`growthx-skills` with `publish` and `search`, one `SKILL.md`, one env var. Install isn't
ours to write — the stock CLI already does it (§6). Folding the existing `growthx-bx-submit`
project submission into the same skill is a reasonable follow-up, but not in this change:
keep the blast radius to skills.

---

## 3. What already exists (reuse, don't rebuild)

| Piece | Where | Reuse as-is? |
|---|---|---|
| API key issue / list / revoke | `gx-backend` `apps/backend/routes/bx/index.ts:1006-1065` | Yes, unchanged |
| API key model, sha256 hash, `key_prefix`, `last_used_at` | `packages/database/models/bx_api_key.ts` | Yes, unchanged |
| `x-api-key` → `req.user` middleware | `apps/backend/middleware/agent.ts` | Yes, unchanged |
| Agent-authed write endpoint pattern | `routes/bx/index.ts:331` (`POST /projects/agent`) | Copy the shape |
| Key management UI | `Built-at-GrowthX` `app/routes/settings.tsx` | Extend copy only |
| Design tokens `C` / `T`, light + dark | `types/index.ts:2-46`, `app/globals.css:5-90` | Yes |
| Card / row / filter-pill patterns | `components/ProjectRow.tsx`, `app/routes/opencode.tsx` | Yes |
| Slug generation | `generateUniqueSlug` from `@growthx-club/services` | Yes |
| Slack submission notification | `SubmissionNotificationService` | Yes, new method |
| Feature flags | `MemberSegmentation.getFlagValueForUser`; pattern at `routes/razorpay/ai-sprint.ts:90-102` | Yes — see §5.3 |
| Flag provisioning migration | `apps/migrations/provision_ai_sprint.ts` | Copy the shape |
| Existing publish skill to model the new one on | `gx-backend` `skills/growthx-bx-submit/SKILL.md` | Yes |
| Membership check (`isMembershipPlanCompleted`) | `routes/bx/index.ts:1077-1083` | Lift into middleware |
| The whole install path | `npx skills` (`vercel-labs/skills`, MIT) | Yes — see §6 |

Two things that do **not** carry over:

- **Presigned upload.** `GET /api/v1/uploads/url` is `validateUser()`-only
  (`apps/backend/routes/uploads.ts:56`) — an API key can't get an upload URL today. Rather
  than widen that route's auth, accept the tarball inline on the publish endpoint as
  `multipart/form-data` and have the server put it to S3. Measured bundle sizes from
  `build-sprint-skills`: median 10 KB, largest (`impeccable`) 810 KB gzipped. A 2 MB cap is
  generous and keeps the request boring.
- **Votes / comments.** Both are `project`-bound. See §2.2 — not shipping them.

---

## 4. Data model

Two new collections, `bx_` prefix per convention.

### `bx_skills` — the package

```ts
{
  _id, slug,                     // unique, kebab-case, immutable after first publish
  name,                          // frontmatter `name`, max 64, /^[a-z0-9-]+$/
  title,                         // human display name, max 100
  description,                   // frontmatter `description` — this is what search hits
  publisher: ObjectId<User>,
  tags: string[],                // max 8
  latest_version: ObjectId<BxSkillVersion> | null,
  install_count: number,
  tier: 'prompt-only' | 'has-executables',   // a label on the page, not a gate
  enabled: boolean,              // kill switch — the only thing that hides a skill
  license: string | null,        // detected from UPSTREAM-LICENSE / LICENSE
  source_url: string | null,     // optional github link
  created_at, updated_at,
}
```

Indexes: `{ slug: 1 }` unique · `{ publisher: 1 }` · `{ install_count: -1 }` ·
`{ updated_at: -1 }` · text index on `name`, `title`, `description`, `tags`.

### `bx_skill_versions` — immutable

```ts
{
  _id, skill: ObjectId<BxSkill>,
  version,                       // semver, unique per skill
  sha256,                        // of the gzipped tarball
  size_bytes,
  storage_key,                   // S3 key
  files: [{ path, size, executable }],  // flat manifest, rendered as the file tree
  skill_md,                      // raw SKILL.md text, stored for web render + diff
  tier: 'prompt-only' | 'has-executables',
  yanked: boolean,
  published_by: ObjectId<User>,
  created_at,
}
```

Indexes: `{ skill: 1, version: 1 }` unique · `{ sha256: 1 }`.

An optional third collection `bx_skill_installs` (`skill`, `version`, `user|null`,
`created_at`) buys per-version install analytics. Not required for v1.

---

## 5. API surface — `/api/v1/bx/skills`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/skills` | none | list; `?q=&tag=&sort=installs\|new&limit=&offset=` |
| GET | `/skills/:slug` | none | detail + version list + `SKILL.md` + file tree |
| GET | `/skills/:slug/versions/:version` | none | one version's manifest |
| GET | `/skills/:slug/download` | none | `?version=` (default latest, non-yanked); 302 to signed S3 URL; increments `install_count` |
| POST | `/skills/agent` | `x-api-key` **+ active membership** | publish. `multipart/form-data`: `tarball` + JSON `meta` |
| DELETE | `/skills/agent/:slug/versions/:version` | `x-api-key` | yank own version |

Plus one route served from the web app's own origin, not under `/api/v1` — see §6:

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `built.growthx.club/.well-known/agent-skills/index.json` | none | the discovery index the `skills` CLI reads |
| GET | `/skills/mine` | JWT | publisher dashboard |
| POST | `/skills/:slug/report` | JWT | → Slack |
| PATCH | `/admin/skills/:slug` | admin | `enabled` kill switch, and allocating a reserved name (§5.1) |

### 5.1 Reserved names — approved 21 Sep 2026

First publish claims a slug. These are the exceptions — names nobody but GrowthX can take.
This list is settled; build against it as written.

The rule for what earns a slot: we own it, someone would reasonably read it as first-party,
or it breaks something. Anything that only *feels* like it should be ours does not qualify —
that's how you end up squatting `frontend-design` (§2.5).

Two kinds of rule. **Prefixes** lock the whole family:

```
growthx-    gx-    bx-
```

**Exact matches** lock one string only, so `claude-tips` and `checkpoint-notes` stay free
while `claude` and `checkpoint` don't.

**A · GrowthX identity**
```
growthx  growthxclub  growth-x  gx  gxclub  bx
```

**B · GrowthX products and surfaces**
```
built-at-growthx  builtatgrowthx  builtat  built-at
build-sprint  buildsprint  build-week  buildweek  ai-sprint  aisprint
member-connect  memberconnect  karma  proof-of-work  pow
```

**C · Skills that are ours**
```
grill-me  art-direction  checkpoint
```
(`growthx-skills` and `growthx-bx-submit` are already covered by the `growthx-` prefix.)

**D · Authority and trust words** — installing one of these should never be ambiguous about
who wrote it
```
official  verified  trusted  certified  approved  endorsed
admin  administrator  root  superuser  sudo  staff  team  moderator  mod
support  helpdesk  security  system  internal  core
```

**E · Route and API collisions** — the detail page is `/skills/:slug`, so any of these would
shadow a real path or a query value
```
skills  skill  new  edit  create  search  find  index  all  browse
mine  me  my  settings  account  profile
login  logout  signin  signup  register  auth
api  v1  download  install  publish  upload
version  versions  latest  report  flag
about  docs  doc  help  terms  privacy  status  health
static  assets  public  well-known  favicon  robots  sitemap
null  undefined  true  false  default
```

**F · Windows device names** — the slug becomes a directory under `.claude/skills/<name>/`,
and these cannot be created on Windows. The Build Sprint installer ships Windows binaries,
so this is a real install failure, not a theoretical one
```
con  prn  aux  nul
com1 … com9    lpt1 … lpt9
```

**G · Third-party brands in our orbit** — exact match only. A skill called `openai` sitting
on a GrowthX registry reads as endorsed by both of us, and if it misbehaves that's our
problem to explain
```
anthropic  claude  claude-code  openai  chatgpt  gpt  codex
google  gemini  vercel  convex  github  slack  notion
stripe  razorpay  aws  amazon  supabase  mongodb
sarvam  mixpanel  sentry  newrelic  cloudflare
```

#### Everything else is open

Including every vendored bundle name — `frontend-design`, `copywriting`, `impeccable`,
`convex-expert`, `convex-auth`, `convex-agent`, `agentation`,
`vercel-react-best-practices`. We didn't write those, so we don't hold them (§2.5).

#### Behaviour

- Checked case-insensitively against the normalised slug, after the CLI's own name rules
  (`^[a-z0-9-]+$`, 1–64 chars, no leading or trailing `-`, no `--`).
- Rejected at publish with a `400` that names the list it hit and suggests an alternative.
  Never silently renamed — a skill whose folder name changed under it stops loading.
- An admin can allocate a locked name to a publisher, which is how GrowthX's own four get
  published and how we grant an exception if someone turns up with a real claim.
- The list lives in one constant in the backend (`RESERVED_EXACT` / `RESERVED_PREFIXES`) and
  is surfaced verbatim on `/skills` under the publishing docs, so it's checkable before
  someone spends an evening naming a skill.

145 exact names across A–G, no duplicates, every one valid under the CLI's own name rules.
Three prefixes.

Maintenance: A–C are permanent. D–G are mechanical rather than principled, so if one of them
blocks a name someone genuinely wants, unlock that single entry rather than reopening the
policy. Adding a name later is cheap; releasing one after somebody has installs pinned to it
is not, so the list starts wide.

### 5.2 Publish semantics

1. Reject >2 MB gz, >200 files, any path containing `..` or starting with `/`.
2. Untar in memory, require `SKILL.md` at the root, parse its frontmatter.
3. `name` in the frontmatter is authoritative. Reject reserved names (§5.1). Otherwise first
   publish claims the slug; reject if the slug exists and the caller isn't its publisher.
4. Classify tier by scanning the file manifest (extension + exec bit). This sets a label
   only — it never blocks the publish (§2.3).
5. Compute sha256. If it matches an existing version of this skill → `200` idempotent no-op
   returning that version. Republishing identical bytes is not an error.
6. Version: explicit `version` in `meta`, else auto-bump the patch off `latest_version`.
   Reject a re-publish of an existing version number with different bytes.
7. Put to S3, insert the version, point `latest_version`. The skill is live at this point —
   it appears in the discovery index on the next fetch.
8. Slack notify. No karma emit — publishing doesn't score (§10.3), so nothing calls
   `KarmaBridgeService` and no new `KarmaBridgeSource` is needed.
9. `201` with slug, version, sha and the `/skills/<slug>` URL.

The tarball arrives as a raw body, not multipart — `express.raw({ type: ['application/gzip',
'application/x-gzip', 'application/octet-stream'], limit: '2mb' })` mounted on the publish
route only. No new dependency, no base64 inflation. Metadata comes from the `SKILL.md`
frontmatter inside the archive, which is authoritative anyway; `?version=` and `?tags=`
are the only query overrides.

### 5.3 Feature flags

Everything ships dark behind two flags, both created **off**:

| Key | Off means |
|---|---|
| `skills-marketplace-enabled` | every `/bx/skills*` route and the discovery index return `404` |
| `skills-publish-enabled` | publish and yank return `404`; reads still work |

The second exists so we can open browsing before writes, and freeze publishing without
taking the registry down.

Read with `MemberSegmentation.getFlagValueForUser(user, key)`. The public routes have no
user, and `getFlagValueForUser({}, key)` resolves the default serve — the `userData._id &&
…` guard at `packages/services/segmentation/service/member.ts:75` falls through to
`pushDefaultFeatureFlagsIfNotExist(MEMBERS)`. Follow `resolveChatGptProOffered`
(`routes/razorpay/ai-sprint.ts:90-102`) for the read, including its rule that a flag which
can't be read counts as off — here that means disabled, so a Redis outage closes the
registry rather than opening it.

Both flags are created by an idempotent migration modelled on `provision_ai_sprint.ts`.
The client learns their state from `GET /bx/me`, which already runs anonymously
(`validateUserAndAnonymous`) and is already called on page load, so no new public config
endpoint.

---

## 6. Install: we don't build one

`npx skills` is `vercel-labs/skills` (MIT). It works on our bundle today because we publish
to GitHub — but GitHub isn't the only source it takes. It also ships a first-class registry
protocol: **well-known discovery**, spec'd at
`https://schemas.agentskills.io/discovery/0.2.0/schema.json`. Serve one JSON file and the
CLI treats our registry as a native source. No fork, no patch, no vendored CLI.

**Verified end to end.** A static index + tarball served over localhost installed cleanly
into both agents with the stock published CLI:

```
npx skills@1.7.0 add http://127.0.0.1:8899 --skill hello-growthx -a claude-code -a codex -y
→ ✓ hello-growthx (copied)
    → ./.claude/skills/hello-growthx
    → ./.agents/skills/hello-growthx
```

### What we serve

`GET https://built.growthx.club/.well-known/agent-skills/index.json`

```json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "grill-me",
      "description": "Interview the user until the plan is clear, before any code…",
      "type": "archive",
      "url": "https://<gx-backend-origin>/api/v1/bx/skills/grill-me/download?version=1.3.0",
      "digest": "sha256:<64 hex of the exact archive bytes>"
    }
  ]
}
```

That's it. The CLI fetches the index, resolves `url` relative to it, downloads, checks the
digest itself, and refuses on mismatch. It writes a `skills-lock.json` recording
`wellKnownDigest`, so version bumps propagate through `skills update` for free.

**`url` must be absolute.** Relative resolution puts it on `built.growthx.club`, which serves
the web app and not `/api/v1` — a relative `/api/v1/bx/skills/…/download` 404s on every
install. The index is built from the same `VITE_API_URL` base the rest of the web app talks
to gx-backend through, so it points at the API origin rather than this one.

### What builders type

```bash
npx skills add built.growthx.club --skill grill-me -a claude-code -a codex -y
npx skills add built.growthx.club --list          # browse the whole registry
npx skills add built.growthx.club/.well-known/agent-skills/grill-me   # single-skill URL
```

Scoped indexes work too: an index at `/u/<username>/.well-known/agent-skills/index.json`
makes `npx skills add built.growthx.club/u/ananya` install one builder's set. Free
namespacing if we want it; not needed for v1.

### Six things to get right

1. **Tar entries must not be `./`-prefixed.** `tar czf x.tgz -C dir .` produces `./SKILL.md`
   and the CLI rejects the whole archive with "not a valid SKILL.md file or supported
   archive" — its path normaliser refuses any `.` or `..` segment. Build with
   `cd dir && tar czf x.tgz SKILL.md scripts …`. Confirmed by failing on the first attempt.
2. **`SKILL.md` must be at the archive root**, not nested under a folder. The extractor
   throws otherwise.
3. **The exec bit is lost.** The CLI's tar reader only carries content, not mode — a
   `chmod +x`'d `run.sh` lands as `-rw-r--r--`. So a skill that ships scripts must invoke
   them as `bash scripts/x.sh` / `node scripts/x.js`, not `./scripts/x`. Lint for this at
   publish and warn the author; it will otherwise fail silently at install time for
   everyone but the person who wrote it.
4. **Strip macOS junk server-side.** Our test tarball shipped `._SKILL.md` and `._scripts`
   AppleDouble files straight through to the installed skill. `gx-backend/skills/.DS_Store`
   is already checked in, so this will happen. Drop `._*` and `.DS_Store` at publish.
5. **Symlinks and hardlinks are rejected** by the extractor. Reject them at publish with a
   clear message rather than letting install fail.
6. **The index is an unauthenticated `fetch`.** No headers, no credentials. Anything in the
   index is world-readable. That's the trade for getting the native CLI path, and it's why
   publishing is gated and reading isn't (§2.6).

### So `growthx-skills` has two verbs, not three

**publish** — find candidate skill folders (`.claude/skills/*/SKILL.md`,
`.agents/skills/*/SKILL.md`, `~/.claude/skills/*`), show what it found, read `name` and
`description` from the frontmatter, run the lints above, warn explicitly when the bundle
contains executables and that it will go to review, print the exact file list, get
confirmation, then `tar czf` and POST.

**search** — `GET /skills?q=`, print name / description / publisher / installs, then hand
the user the `npx skills add built.growthx.club --skill <name>` line to run.

Install is deleted from our scope. The CLI already handles multi-agent layout, symlink vs
copy, the lockfile and updates — all of which I was about to reimplement badly.

Distribution: add `growthx-skills` to `GrowthX-Club/build-sprint-skills` so it arrives with
the existing `npx --yes skills add … --skill '*'` one-liner.

---

## 7. Web surface

### `/skills` — index

- Same shell as `/projects`: nav, warm background, single column, ~760px max.
- Search input pinned at the top. This page is search-first, unlike the project feed.
- Horizontal tag filter pills reusing the `/opencode` pattern — already horizontally
  scrollable on mobile (#76).
- **"In your Build Sprint bundle"** strip directly under the search box: the eleven bundled
  skills, each showing its real upstream (`anthropics/skills`, `get-convex/agent-skills`, …)
  and the `npx skills add GrowthX-Club/build-sprint-skills --skill <name>` line. Visually
  distinct from community rows — these are links out, not registry entries (§2.5). Collapsed
  to a few rows with a "show all 11".
- Below it, **"From the community"** — the registry proper. Rows, not cards: mono name,
  one-line description, publisher avatar + name, install count, tag chips, and a small
  `⚡ scripts` marker for tier 2.
- Sort applies to the community list: Most installed / Recently updated.
- Search spans both, with bundle hits grouped under their own heading.

### `/skills/:slug` — detail

Header: name in mono, title, description, publisher, install count, version + published
date, license. One primary action — a copy-to-clipboard install command, which is the stock
CLI, not ours:

```
npx skills add built.growthx.club --skill grill-me -a claude-code -a codex
```

Then, in the order a reader needs to decide whether to trust it:

1. **Rendered `SKILL.md`** — full, not truncated. This is the product.
2. **File tree** — every path, size, exec bit flagged in the error colour.
3. **Versions** — list, with a diff link between adjacent versions of `SKILL.md`.
4. Report link.

Tier 2 skills get a banner above the fold: this skill ships executable files, here they are,
read them before installing. The banner must not imply we checked them — nothing is reviewed
before it goes live (§2.3), and a banner that hints otherwise is worse than none.

### `/settings`

Extend the existing API key page with a publishing line and a link to `/skills/mine`.

### Handbook

A new block in the setup section of `/learn/build-sprint`: the one-click key (§2.6) and a
link to `/skills`. This is the only change outside the two repos.

---

## 8. Phasing

| Phase | Scope | Rough size |
|---|---|---|
| 1 | Backend: models, publish, list, detail, download, search, tier classification, S3, membership gate, reserved-name validator (§5.1) | 2–3 d |
| 2 | `.well-known/agent-skills/index.json` route + publish-time archive lints (§6) | 0.5 d |
| 3 | `growthx-skills` skill: publish / search, added to the bundle repo | 0.5 d |
| 4 | Seed the four GrowthX-owned skills; build the bundle strip catalog (§2.5) | 0.5 d |
| 5 | Web: `/skills` index + detail + settings link | 2 d |
| 6 | Admin PATCH (`enabled` + reserved-name allocation), report → Slack | 0.5 d |
| 7 | Handbook one-click key block | 0.5 d |

Phases 1–3 are the usable product: a builder can publish, and anyone can install with
`npx skills add built.growthx.club --skill <name>` before a single page exists. Phase 5 is
what makes it browsable. If we're short before kickoff, ship 1–4 and let `/skills` land
mid-sprint.

Dropping our own installer took roughly a day out of phase 3 and removed the multi-agent
layout, symlink/copy and update-check surface entirely.

---

## 9. Explicitly out of scope for v1

Upvotes, comments, skill-to-skill dependencies, private or unlisted skills, org namespaces
(`@user/skill`), semantic search, a web publish form, auto-syncing from a GitHub repo,
analytics beyond an install counter, and folding `growthx-bx-submit` into the new skill.

---

## 10. Questions

### Settled (Pranav, 21 Sep)

1. **Domain** — `built.growthx.club`.
2. **Who can publish** — any GrowthX API key, members only. Needs the membership gate built;
   see §2.6.
3. **Does publishing score toward the sprint** — no. Which keeps the safety maths simple:
   nobody has an incentive to publish filler.
4. **How install works with `npx skills`** — well-known discovery, §6. Answered and verified.
5. **Who can install** — anyone. Public read, members-only publish. Which is what the
   protocol wants anyway: the CLI fetches the index unauthenticated. Every published skill
   is therefore world-readable, and the publish confirmation must say so plainly so nobody
   finds out afterwards.
6. **Name collisions** — reserved list approved, §5.1: 145 exact names plus three prefixes.
   The vendored bundle names are deliberately not on it, which is also why those eight
   aren't published into the registry at all (§2.5).

7. **Tier-2 review** — there isn't one. Members are trusted, skills go live on publish, same
   as projects. Executables get a louder page, not a queue. The kill switch and the Slack
   firehose are the controls; §2.3.

### Still open

Nothing. Phase 1 can start.
