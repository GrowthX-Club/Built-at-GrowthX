"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { useResponsive } from "@/hooks/useMediaQuery";

// ---- Inline Components ----

function Av({ initials, size = 32, role, src }: { initials: string; size?: number; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img
        src={src}
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
    <div style={{
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

function Badge({ role }: { role: string }) {
  const r = ROLES[role];
  if (!r) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: T.badge, fontWeight: 650, letterSpacing: "0.04em",
      padding: "2px 6px", borderRadius: 4,
      color: r.color, background: r.bg,
      fontFamily: "var(--sans)", textTransform: "uppercase", lineHeight: 1,
    }}>
      {r.label}
    </span>
  );
}

function CompanyTag({ company, companyColor, companyLogo }: { company?: string; companyColor?: string; companyLogo?: string }) {
  if (!company) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: T.caption, fontWeight: 550, color: C.textSec,
      fontFamily: "var(--sans)",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 4,
        background: companyColor || C.textMute, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: T.micro, fontWeight: 800, color: "#fff",
        overflow: "hidden", position: "relative",
      }}>
        {company[0]}
        <img src={getCompanyLogoUrl(company, companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </span>
      {company}
    </span>
  );
}

// ---- Page ----

export default function BuildersPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderProfile | null>(null);
  const [builderProjects, setBuilderProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bxApi("/members").then((r) => r.json()).then((d) => {
      setBuilders((d.members || []).map((m: Record<string, unknown>) => normalizeMember(m)));
    }).finally(() => setLoading(false));
  }, []);

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
    setLoadingProjects(true);
    bxApi("/projects?limit=100")
      .then(r => r.json())
      .then(d => {
        const all = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        const matched = all.filter((p: Project) => {
          if (p.builder?.name === b.name) return true;
          if ((p.creators || []).some(c => c.name === b.name)) return true;
          if (p.collabs?.some(c => c.name === b.name)) return true;
          return false;
        });
        setBuilderProjects(matched);
      })
      .finally(() => setLoadingProjects(false));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            The people who build
          </h1>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Reputation is earned by shipping. Ranked by cumulative score across projects, buildathons, and collaborations.
          </p>
        </div>

        {/* Builder list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loading && builders.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, display: "flex", gap: 16, alignItems: "center",
              }}>
                <div className="skeleton" style={{ width: 28, height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 44 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="skeleton" style={{ height: 15, width: 120 }} />
                    <div className="skeleton" style={{ height: 14, width: 50, borderRadius: 4 }} />
                  </div>
                  <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 6 }} />
                  <div style={{ display: "flex", gap: 16 }}>
                    <div className="skeleton" style={{ height: 12, width: 60 }} />
                    <div className="skeleton" style={{ height: 12, width: 50 }} />
                  </div>
                </div>
              </div>
            ))
          ) : builders.length === 0 ? (
            <p style={{ fontSize: T.body, color: C.textMute, padding: "40px 0", textAlign: "center" }}>
              No builders found.
            </p>
          ) : null}
          {builders.map((b, i) => (
            <div
              key={b._id || i}
              className={`fade-up stagger-${Math.min(i + 1, 6)} list-item-hover`}
              onClick={() => openBuilderDialog(b)}
              style={{
                padding: isMobile ? "14px 16px" : "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, cursor: "pointer",
                display: "flex", gap: isMobile ? 12 : 16, alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                fontSize: T.body, fontWeight: 650, color: C.textMute,
                fontFamily: "var(--sans)", width: 28, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <Av initials={b.avatar} size={isMobile ? 36 : 44} role={b.role} src={b.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{b.name}</span>
                  <Badge role={b.role} />
                  <CompanyTag company={b.company} companyColor={b.companyColor} companyLogo={b.companyLogo} />
                </div>
                {b.bio && (
                  <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", margin: "0 0 4px", fontWeight: 400 }}>{b.bio}</p>
                )}
                <div style={{ display: "flex", gap: 16, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                  {b.city && <span>{b.city}</span>}
                  <span>{b.shipped} shipped</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                    <span style={{ fontSize: T.subtitle, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{selectedBuilder.name}</span>
                    <Badge role={selectedBuilder.role} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <CompanyTag company={selectedBuilder.company} companyColor={selectedBuilder.companyColor} companyLogo={selectedBuilder.companyLogo} />
                    {selectedBuilder.city && (
                      <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>{selectedBuilder.city}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilder(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.borderLight}`, background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
                    transition: "all 0.12s", flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
                >{"\u00D7"}</button>
              </div>
              {selectedBuilder.bio && (
                <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, margin: "12px 0 0", lineHeight: 1.5 }}>
                  {selectedBuilder.bio}
                </p>
              )}
            </div>

            {/* Projects */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              <div style={{
                fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)",
              }}>
                Projects ({loadingProjects ? "..." : builderProjects.length})
              </div>

              {loadingProjects ? (
                <p style={{ fontSize: T.bodySm, color: C.textMute, textAlign: "center", padding: "24px 0" }}>Loading...</p>
              ) : builderProjects.length === 0 ? (
                <p style={{ fontSize: T.bodySm, color: C.textMute, textAlign: "center", padding: "24px 0" }}>No projects yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {builderProjects.map(p => {
                    const isCreator = p.builder?.name === selectedBuilder.name || (p.creators || []).some(c => c.name === selectedBuilder.name);
                    return (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedBuilder(null); router.push(`/projects/${p.id}`); }}
                        style={{
                          padding: "14px 18px", background: C.bg,
                          border: `1px solid ${C.borderLight}`, borderRadius: 12,
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.transform = "none"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <div style={{ fontSize: T.body, fontWeight: 560, color: C.text, fontFamily: "var(--sans)" }}>
                            {p.name}
                          </div>
                          <span style={{
                            fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                            padding: "2px 7px", borderRadius: 4,
                            fontFamily: "var(--sans)",
                            background: isCreator ? "#D1FAE5" : C.accentSoft,
                            color: isCreator ? "#059669" : C.textMute,
                          }}>
                            {isCreator ? "Creator" : "Collaborator"}
                          </span>
                        </div>
                        <div style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, marginBottom: 8 }}>
                          {p.tagline}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: T.label, opacity: 0.5 }}>{"\u25B3"}</span>
                            {p.weighted.toLocaleString()}
                          </span>
                          {p.stack && p.stack.length > 0 && (
                            <span>{p.stack.slice(0, 3).join(", ")}{p.stack.length > 3 ? ` +${p.stack.length - 3}` : ""}</span>
                          )}
                        </div>
                      </div>
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
