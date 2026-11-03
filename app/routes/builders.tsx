import { useState, useEffect, useRef, Suspense } from "react";
import { Await, Link, useLoaderData } from "react-router";
import type { MetaFunction } from "react-router";
import { pageMeta, breadcrumbLd } from "@/lib/seo";
import SearchBox from "@/components/SearchBox";
import { fetchAllProjects, serverSignal } from "@/lib/collections";
import {
  C,
  T,
  ROLES,
  type BuilderProfile,
  type Project,
  normalizeMember,
  normalizeProject,
  getCompanyLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";

const DESCRIPTION = "GrowthX members who ship, ranked by projects shipped, with upvotes breaking ties.";

type RawMember = Record<string, unknown>;
async function fetchMembers(offset: number): Promise<{ members: RawMember[]; totalCount: number }> {
  try {
    const r = await bxApi(`/members?limit=100&offset=${offset}`, { signal: serverSignal() });
    if (!r.ok) return { members: [], totalCount: 0 };
    const d = await r.json();
    return { members: d.members ?? [], totalCount: d.totalCount ?? 0 };
  } catch {
    return { members: [], totalCount: 0 };
  }
}

type TopProject = { name: string; slug: string };
// Each builder's most-upvoted few projects (creator or co-creator), from one pass over the catalogue;
// kept 10 minutes per server instance and streamed after the list, so it never holds the page.
let topCache: { at: number; map: Record<string, TopProject[]> } | null = null;
async function topProjectsByBuilder(): Promise<Record<string, TopProject[]>> {
  if (topCache && Date.now() - topCache.at < 600000) return topCache.map;
  const all = await fetchAllProjects({ sort: "new" });
  if (all.error) return topCache?.map ?? {};
  const byVotes = [...all.projects].sort((a, b) => Number(b.weighted_votes ?? 0) - Number(a.weighted_votes ?? 0));
  const map: Record<string, TopProject[]> = {};
  for (const p of byVotes) {
    const ids = [p.creator, ...((p.creators as unknown[]) ?? [])]
      .map(u => (u && typeof u === "object" ? String((u as { _id?: string })._id ?? "") : String(u ?? "")))
      .filter(Boolean);
    for (const id of Array.from(new Set(ids))) {
      const list = (map[id] ??= []);
      if (list.length < 3) list.push({ name: String(p.name ?? ""), slug: String(p.slug || p._id) });
    }
  }
  topCache = { at: Date.now(), map };
  return map;
}

export async function loader() {
  return { ...(await fetchMembers(0)), top: topProjectsByBuilder() };
}

export const meta: MetaFunction = () => [
  ...pageMeta({ title: "Builders — Built at GrowthX", description: DESCRIPTION, path: "/builders" }),
  { "script:ld+json": breadcrumbLd([{ name: "Built at GrowthX", path: "/" }, { name: "Builders", path: "/builders" }]) },
];

// ---- Inline Components ----

function Av({ initials, size = 32, role, src, className }: { initials: string; size?: number; role?: string; src?: string; className?: string }) {
  const r = role ? ROLES[role] : undefined;
  // A profile photo that no longer exists falls back to the initials.
  const [broken, setBroken] = useState(false);
  if (src && src.startsWith("http") && !broken) {
    return (
      <img
        src={src}
        className={className}
        onError={() => setBroken(true)}
        alt={initials}
        style={{
          width: size, height: size, borderRadius: size,
          border: `1px solid ${C.borderLight}`, flexShrink: 0,
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: size,
      background: r?.bg || C.accentSoft,
      color: r?.color || C.textSec,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 650,
      fontFamily: "var(--sans)", letterSpacing: "0.01em",
      border: `1px solid ${C.borderLight}`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function CompanyTag({ company, companyLogo }: { company?: string; companyColor?: string; companyLogo?: string }) {
  if (!company) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, color: C.textSec, fontFamily: "var(--sans)" }}>
      <img
        src={getCompanyLogoUrl(company, companyLogo)}
        alt=""
        width={16}
        height={16}
        style={{ borderRadius: 4, objectFit: "contain", flexShrink: 0 }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {company}
    </span>
  );
}

// ---- Page ----

export default function BuildersPage() {
  const first = useLoaderData<typeof loader>();
  const [builders, setBuilders] = useState<BuilderProfile[]>(() => first.members.map(normalizeMember));
  const [totalCount, setTotalCount] = useState(first.totalCount);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");

  // Dialog state
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderProfile | null>(null);
  const [builderProjects, setBuilderProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const loadMore = async (all = false) => {
    if (loadingMore || builders.length >= totalCount) return;
    setLoadingMore(true);
    const offsets: number[] = [];
    for (let o = builders.length; o < (all ? totalCount : builders.length + 1); o += 100) offsets.push(o);
    const pages = await Promise.all(offsets.map(fetchMembers));
    setBuilders(prev => {
      const seen = new Set(prev.map(b => b._id));
      return [...prev, ...pages.flatMap(p => p.members).map(normalizeMember).filter(b => !seen.has(b._id))];
    });
    if (pages[0]?.totalCount) setTotalCount(pages[0].totalCount);
    setLoadingMore(false);
  };

  // Searching looks across every builder, so fetch the rest once.
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searching = query.trim().length >= 2;
  useEffect(() => { if (searching) loadMore(true); }, [searching]); // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = builders.map((b, i) => ({ b, rank: i + 1 }));
  const shown = searching
    ? ranked.filter(({ b }) => words.every(w => `${b.name} ${b.title ?? ""} ${b.company ?? ""} ${b.city}`.toLowerCase().includes(w)))
    : ranked;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) setSelectedBuilder(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openBuilderDialog = (b: BuilderProfile) => {
    setSelectedBuilder(b);
    setBuilderProjects([]);
    if (!b._id) return;
    setLoadingProjects(true);
    bxApi(`/projects?creator=${encodeURIComponent(b._id)}&limit=100`)
      .then(r => r.json())
      .then(d => {
        const all = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        setBuilderProjects(all);
      })
      .finally(() => setLoadingProjects(false));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="page narrow">
        <header className="page-head">
          <h1 className="page-title">The people who build</h1>
          <p className="page-sub">{DESCRIPTION}</p>
          <SearchBox value={query} onChange={setQuery} placeholder="Search builders, companies or cities" />
        </header>

        {searching && !loadingMore && (
          <p className="list-count">{shown.length === 0 ? "No builders match" : `${shown.length} ${shown.length === 1 ? "builder matches" : "builders match"}`} “{query.trim()}”</p>
        )}

        <ol className="builder-list">
          {shown.map(({ b, rank }) => (
            <li key={b._id || rank} className="builder-row">
              <span className="builder-rank">{rank}</span>
              <Av initials={b.avatar} size={48} role={b.role} src={b.avatarUrl} className="builder-av" />
              <span className="builder-text">
                <button type="button" className="builder-name" onClick={() => openBuilderDialog(b)}>{b.name}</button>
                {(b.title || b.company) && (
                  <span className="builder-work">
                    {b.title}{b.title && b.company ? " at " : ""}
                    {b.company && <CompanyTag company={b.company} companyColor={b.companyColor} companyLogo={b.companyLogo} />}
                  </span>
                )}
                <span className="builder-meta">{[b.city, `${b.shipped} shipped`].filter(Boolean).join(" · ")}</span>
              </span>
              <Suspense fallback={null}>
                <Await resolve={first.top}>
                  {(top: Record<string, TopProject[]>) => (top[b._id ?? ""] ?? []).length > 0 && (
                    <span className="builder-projects">
                      {top[b._id ?? ""].map(t => <Link key={t.slug} to={`/projects/${t.slug}`} prefetch="intent">{t.name}</Link>)}
                    </span>
                  )}
                </Await>
              </Suspense>
            </li>
          ))}
        </ol>

        {!searching && builders.length < totalCount && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button type="button" className="btn-outline" onClick={() => loadMore()} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Show more builders"}
            </button>
          </div>
        )}
        {searching && shown.length === 0 && !loadingMore && (
          <div className="empty-state">
            <p className="empty-title">Nobody here matches “{query.trim()}”</p>
            <button type="button" className="btn-outline" onClick={() => setQuery("")}>Clear search</button>
          </div>
        )}
      </main>

      {/* Builder projects dialog */}
      {selectedBuilder && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div
            onClick={() => setSelectedBuilder(null)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
              animation: "fadeIn 0.2s ease",
            }}
          />
          <div ref={dialogRef} className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 520,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column",
            animation: "fadeUp 0.25s ease-out",
          }}>
            {/* Header */}
            <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Av initials={selectedBuilder.avatar} size={52} role={selectedBuilder.role} src={selectedBuilder.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{selectedBuilder.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13, color: C.textSec }}>
                    {selectedBuilder.title && <span>{selectedBuilder.title}{selectedBuilder.company ? " at" : ""}</span>}
                    <CompanyTag company={selectedBuilder.company} companyColor={selectedBuilder.companyColor} companyLogo={selectedBuilder.companyLogo} />
                    {selectedBuilder.city && <span>· {selectedBuilder.city}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilder(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.borderLight}`, background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 22, color: C.textSec,
                    transition: "all 0.12s", flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
                >{"\u00D7"}</button>
              </div>
              {selectedBuilder.bio && (
                <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, margin: "12px 0 0", lineHeight: 1.5 }}>
                  {selectedBuilder.bio}
                </p>
              )}
            </div>

            {/* Projects */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 12px", fontFamily: "var(--sans)" }}>
                Projects{loadingProjects ? "" : ` (${builderProjects.length})`}
              </h3>

              {loadingProjects ? (
                <p style={{ fontSize: 13, color: C.textSec, textAlign: "center", padding: "24px 0" }}>Loading…</p>
              ) : builderProjects.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textSec, textAlign: "center", padding: "24px 0" }}>No projects yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {builderProjects.map(p => {
                    const isCreator = p.builder?._id === selectedBuilder._id || (p.creators || []).some(c => c._id === selectedBuilder._id);
                    return (
                      <Link key={p.id} to={`/projects/${p.slug || p.id}`} className="builder-project" onClick={() => setSelectedBuilder(null)}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{p.name}</span>
                          {!isCreator && <span style={{ fontSize: 13, color: C.textSec }}>Collaborator</span>}
                        </span>
                        <span style={{ fontSize: 13, color: C.textSec, lineHeight: 1.45 }}>{p.tagline}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
