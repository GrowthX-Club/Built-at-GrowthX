import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  C,
  T,
  TRACK_LABELS,
  type Project,
  type BuilderProfile,
  type TrackKey,
  normalizeProject,
  normalizeUser,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { extractPlainText } from "@/lib/editor-utils";

const VALID_TRACKS: TrackKey[] = ["virality", "revenue", "maas"];

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride } = useNavOverride();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<{ id: string | number; type: "toggle" | "publish" } | null>(null);

  const loadMyData = useCallback(() => {
    bxApi("/me").then((r) => r.json()).then((d) => {
      const u = normalizeUser(d.user);
      if (!u) {
        openLoginDialog(() => { loadMyData(); });
        return;
      }
      setUser(u);
    });
    bxApi("/my-projects").then((r) => r.json()).then((d) => {
      const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
      setProjects(list);
    }).finally(() => setLoading(false));
  }, [openLoginDialog]);

  useEffect(() => {
    loadMyData();
  }, [loadMyData]);

  useEffect(() => {
    setNavOverride({ title: "My Projects", backHref: "/oc" });
    return () => clearNavOverride();
  }, [setNavOverride, clearNavOverride]);

  const toggleEnabled = async (p: Project) => {
    if (busyAction) return;
    const newEnabled = !p.enabled;
    setBusyAction({ id: p.id, type: "toggle" });
    try {
      const res = await bxApi(`/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (res.ok) {
        setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, enabled: newEnabled } : proj));
      }
    } catch { /* ignore */ }
    setBusyAction(null);
  };

  const publishProject = async (p: Project) => {
    if (busyAction) return;
    if (!p.url?.trim()) {
      navigate(`/my-projects/${p.id}/edit`);
      return;
    }
    setBusyAction({ id: p.id, type: "publish" });
    try {
      const res = await bxApi(`/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDraft: false }),
      });
      if (res.ok) {
        setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, isDraft: false } : proj));
      }
    } catch { /* ignore */ }
    setBusyAction(null);
  };

  if (!user && !loading) return null;

  return (
    <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px", fontFamily: "var(--sans)" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            My Projects
          </h1>
          <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
            Manage and edit the projects you&apos;ve submitted.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "24px 28px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 17, width: "50%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 14, width: "80%" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="skeleton" style={{ height: 13, width: 40 }} />
                    <div className="skeleton" style={{ width: 50, height: 30, borderRadius: 8 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 13, width: "60%", marginTop: 8 }} />
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 20, width: 45, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            padding: "48px 32px", textAlign: "center",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          }}>
            <p style={{ fontSize: T.bodyLg, color: C.textSec, marginBottom: 16 }}>You haven&apos;t submitted any projects yet.</p>
            <button onClick={() => navigate("/?submit=1")} style={{
              padding: "10px 24px", borderRadius: 10,
              border: "none", background: C.accent, color: C.accentFg,
              fontSize: T.body, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
            }}>
              Submit your first project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projects.map((p, i) => {
              // Collaborators = creators + collabs, excluding the viewing user
              // (viewer = submitter is already shown via `p.builder` upstream).
              const collaborators = [
                ...(p.creators || []),
                ...(p.collabs || []),
              ].filter((c) => !user?._id || c._id !== user._id);
              const rawP = p as unknown as Record<string, unknown>;
              const rawPrimary = rawP.primaryTrack;
              const primaryTrack: TrackKey | null =
                typeof rawPrimary === "string" && VALID_TRACKS.includes(rawPrimary as TrackKey)
                  ? (rawPrimary as TrackKey)
                  : null;
              const rawSecondaries = Array.isArray(rawP.secondaryTracks) ? rawP.secondaryTracks : [];
              const secondaryTracks: TrackKey[] = (rawSecondaries as unknown[])
                .filter((t): t is TrackKey => typeof t === "string" && VALID_TRACKS.includes(t as TrackKey))
                .filter((t, idx, arr) => arr.indexOf(t) === idx);
              const showMetaRow = collaborators.length > 0 || primaryTrack !== null;
              const visibleCollabs = collaborators.slice(0, 5);
              const extraCollabCount = Math.max(0, collaborators.length - visibleCollabs.length);

              return (
              <div key={p.id} className={`fade-up stagger-${Math.min(i + 1, 6)} list-item-hover`} style={{
                padding: "24px 28px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                opacity: p.enabled ? 1 : 0.5, transition: "opacity 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div style={{
                        fontSize: T.subtitle, fontWeight: 550, color: C.text,
                        fontFamily: "var(--sans)", cursor: "pointer",
                      }} onClick={() => navigate(`/projects/${p.slug || p.id}`)}>
                        {p.name}
                      </div>
                      {p.isDraft && (
                        <span style={{
                          fontSize: T.badge, fontWeight: 600, color: C.gold,
                          fontFamily: "var(--sans)", padding: "2px 6px",
                          borderRadius: 4, background: C.goldSoft,
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>Draft</span>
                      )}
                      {!p.enabled && !p.isDraft && (
                        <span style={{
                          fontSize: T.badge, fontWeight: 600, color: C.textMute,
                          fontFamily: "var(--sans)", padding: "2px 6px",
                          borderRadius: 4, background: C.borderLight,
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>Hidden</span>
                      )}
                    </div>
                    <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                      {p.tagline}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      fontSize: T.bodySm, fontWeight: 600, color: C.textSec,
                      fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{ fontSize: T.bodySm, opacity: 0.5 }}>{"\u25B3"}</span>
                      {p.weighted.toLocaleString()}
                    </div>
                    <button
                      onClick={() => toggleEnabled(p)}
                      disabled={!!busyAction}
                      title={p.enabled ? "Visible on homepage — click to hide" : "Hidden from homepage — click to show"}
                      style={{
                        position: "relative", width: 36, height: 20, borderRadius: 10,
                        border: "none", cursor: busyAction ? "default" : "pointer",
                        background: p.enabled ? C.green : C.borderLight,
                        transition: "background 0.2s", flexShrink: 0, padding: 0,
                        opacity: busyAction?.id === p.id && busyAction.type === "toggle" ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 2, left: p.enabled ? 18 : 2,
                        width: 16, height: 16, borderRadius: 8,
                        background: "#fff", transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }} />
                    </button>
                    {p.isDraft && (
                      <button
                        onClick={() => publishProject(p)}
                        disabled={!!busyAction}
                        style={{
                          padding: "7px 16px", borderRadius: 8,
                          border: "none", background: C.green,
                          cursor: busyAction ? "default" : "pointer",
                          fontSize: T.bodySm, fontWeight: 600,
                          color: "#fff", fontFamily: "var(--sans)",
                          transition: "opacity 0.12s",
                          opacity: busyAction?.id === p.id && busyAction.type === "publish" ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (!busyAction) e.currentTarget.style.opacity = "0.85"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                      >
                        {busyAction?.id === p.id && busyAction.type === "publish" ? "Publishing..." : "Publish"}
                      </button>
                    )}
                    <button onClick={() => navigate(`/my-projects/${p.id}/edit`)} disabled={!!busyAction} style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.surface,
                      cursor: busyAction ? "default" : "pointer", fontSize: T.bodySm, fontWeight: 600,
                      color: C.text, fontFamily: "var(--sans)",
                      transition: "all 0.12s",
                      opacity: busyAction ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!busyAction) e.currentTarget.style.borderColor = C.accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {p.description && (() => {
                  const plain = extractPlainText(p.description);
                  return plain ? (
                    <p style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", margin: "8px 0 0", lineHeight: 1.5 }}>
                      {plain.length > 150 ? plain.slice(0, 150) + "..." : plain}
                    </p>
                  ) : null;
                })()}

                {showMetaRow && (
                  <div style={{
                    display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
                    marginTop: 12,
                  }}>
                    {collaborators.length > 0 && (
                      <div
                        title={collaborators.map((c) => c.name).filter(Boolean).join(", ")}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {visibleCollabs.map((c, ci) => {
                            const initials = (c.name || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                            return c.avatarUrl ? (
                              <img
                                key={c._id || ci}
                                src={c.avatarUrl}
                                alt={c.name}
                                title={c.name}
                                style={{
                                  width: 24, height: 24, borderRadius: 24,
                                  border: `2px solid ${C.surface}`,
                                  objectFit: "cover", flexShrink: 0,
                                  marginLeft: ci === 0 ? 0 : -8,
                                  background: C.surface,
                                }}
                              />
                            ) : (
                              <span
                                key={c._id || ci}
                                title={c.name}
                                style={{
                                  width: 24, height: 24, borderRadius: 24,
                                  background: C.accentSoft, color: C.textSec,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontSize: T.micro, fontWeight: 700, fontFamily: "var(--sans)",
                                  border: `2px solid ${C.surface}`, flexShrink: 0,
                                  marginLeft: ci === 0 ? 0 : -8,
                                }}
                              >
                                {initials}
                              </span>
                            );
                          })}
                          {extraCollabCount > 0 && (
                            <span
                              title={collaborators.slice(5).map((c) => c.name).filter(Boolean).join(", ")}
                              style={{
                                width: 24, height: 24, borderRadius: 24,
                                background: C.borderLight, color: C.textMute,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: T.micro, fontWeight: 700, fontFamily: "var(--sans)",
                                border: `2px solid ${C.surface}`, flexShrink: 0,
                                marginLeft: -8,
                              }}
                            >
                              +{extraCollabCount}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {primaryTrack && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20,
                        background: C.accent, color: C.accentFg,
                        fontSize: T.caption, fontWeight: 600, fontFamily: "var(--sans)",
                        letterSpacing: "0.01em",
                      }}>
                        {TRACK_LABELS[primaryTrack]}
                      </span>
                    )}
                    {secondaryTracks
                      .filter((t) => t !== primaryTrack)
                      .map((t) => (
                        <span key={t} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 10px", borderRadius: 20,
                          background: "transparent", color: C.textSec,
                          border: `1px solid ${C.border}`,
                          fontSize: T.caption, fontWeight: 550, fontFamily: "var(--sans)",
                        }}>
                          {TRACK_LABELS[t]}
                        </span>
                      ))}
                  </div>
                )}

                {p.stack && p.stack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                    {p.stack.map((s, si) => (
                      <span key={si} style={{
                        padding: "3px 8px", borderRadius: 6,
                        background: C.accentSoft, fontSize: T.caption, color: C.textSec,
                        fontWeight: 500, fontFamily: "var(--sans)",
                      }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
    </main>
  );
}
