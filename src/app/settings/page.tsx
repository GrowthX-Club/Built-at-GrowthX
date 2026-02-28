"use client";

import { useState, useEffect, useCallback } from "react";
import {
  C,
  T,
  type BuilderProfile,
  type BxApiKey,
  normalizeUser,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";

// ---- Inline Components ----

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---- Main Page ----

export default function SettingsPage() {
  const { openLoginDialog } = useLoginDialog();

  // Auth + User
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // API Keys
  const [keys, setKeys] = useState<BxApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);

  // Create key flow
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // One-time key reveal
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Revoke flow
  const [revokeTarget, setRevokeTarget] = useState<BxApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  // OpenClaw guide
  const [guideExpanded, setGuideExpanded] = useState(false);

  // ---- Data loading ----

  const loadKeys = useCallback(() => {
    setKeysLoading(true);
    bxApi("/api-keys")
      .then(r => r.json())
      .then(d => {
        if (d.success) setKeys(d.api_keys || []);
      })
      .catch(() => {})
      .finally(() => setKeysLoading(false));
  }, []);

  useEffect(() => {
    bxApi("/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          const u = normalizeUser(d.user);
          setUser(u);
          if (u && u.isMembershipActive) loadKeys();
          else setKeysLoading(false);
        } else {
          setKeysLoading(false);
          openLoginDialog(() => { window.location.reload(); });
        }
      })
      .catch(() => {
        setKeysLoading(false);
      })
      .finally(() => setUserLoading(false));
  }, [loadKeys, openLoginDialog]);

  // ---- Handlers ----

  const handleCreateKey = async () => {
    const name = newKeyName.trim();
    if (!name || creating) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await bxApi("/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.msg || data.message || "Failed to create key");
        return;
      }
      setRevealedKey(data.api_key);
      setShowCreateModal(false);
      setShowRevealModal(true);
      setNewKeyName("");
      loadKeys();
    } catch {
      setCreateError("Could not reach server");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!revokeTarget || revoking) return;
    setRevoking(true);
    try {
      const res = await bxApi(`/api-keys/${revokeTarget._id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(prev => prev.filter(k => k._id !== revokeTarget._id));
        setRevokeTarget(null);
      }
    } catch {
      // silently fail
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user && !userLoading) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        {/* Page header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{ fontSize: T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            API Keys
          </h1>
          <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
            Manage API keys for OpenClaw and other integrations.
          </p>
        </div>

        {userLoading ? (
          /* Loading skeleton */
          <div className="fade-up stagger-1" style={{
            padding: "24px 28px", background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 14,
          }}>
            <div className="skeleton" style={{ height: 17, width: "40%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: "55%" }} />
          </div>
        ) : user && !user.isMembershipActive ? (
          /* Membership gate */
          <div className="fade-up stagger-1" style={{
            padding: "48px 32px", textAlign: "center",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 56, margin: "0 auto 20px",
              background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: T.heading,
            }}>
              {"\u{1F512}"}
            </div>
            <h3 style={{ fontSize: T.subtitle, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 8 }}>
              Active membership required
            </h3>
            <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.5 }}>
              API key management is available to members with an active GrowthX membership.
            </p>
            <a
              href="https://growthx.club"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 10,
                background: C.accent, color: "#fff",
                fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
                textDecoration: "none", transition: "opacity 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Learn about GrowthX
            </a>
          </div>
        ) : user ? (
          /* API Keys section */
          <>
            {/* Header + Create button */}
            <div className="fade-up stagger-1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>
                Your API keys
              </span>
              <button
                onClick={() => { setShowCreateModal(true); setCreateError(""); setNewKeyName(""); }}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: C.accent, color: "#fff", border: "none",
                  fontSize: T.bodySm, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 6,
                  transition: "opacity 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create API key
              </button>
            </div>

            {keysLoading ? (
              /* Key list skeleton */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[0, 1].map(i => (
                  <div key={i} className={`fade-up stagger-${i + 2}`} style={{
                    padding: "16px 20px", background: C.surface,
                    border: `1px solid ${C.border}`, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: "30%", marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: "60%" }} />
                    </div>
                    <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : keys.length === 0 ? (
              /* Empty state */
              <div className="fade-up stagger-2" style={{
                padding: "48px 32px", textAlign: "center",
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 48, margin: "0 auto 16px",
                  background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: T.title,
                }}>
                  {"\u{1F511}"}
                </div>
                <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", marginBottom: 4 }}>
                  No API keys yet
                </p>
                <p style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)" }}>
                  Create a key to connect OpenClaw or other integrations.
                </p>
              </div>
            ) : (
              /* Key list */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {keys.map((k, i) => (
                  <div key={k._id} className={`fade-up stagger-${Math.min(i + 2, 6)}`} style={{
                    padding: "16px 20px", background: C.surface,
                    border: `1px solid ${C.border}`, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 4 }}>
                        {k.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: T.bodySm, fontFamily: "var(--mono)", color: C.textSec }}>
                          {k.key_prefix}{"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                        </span>
                        <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                          Created {formatDate(k.created_at)}
                        </span>
                        <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                          {k.last_used_at ? `Last used ${timeAgo(k.last_used_at)}` : "Never used"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setRevokeTarget(k)}
                      style={{
                        padding: "6px 14px", borderRadius: 8,
                        border: "1px solid #FECACA", background: "transparent",
                        fontSize: T.label, fontWeight: 550, color: "#DC2626",
                        cursor: "pointer", fontFamily: "var(--sans)",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* OpenClaw Setup Guide */}
            <div style={{
              marginTop: 32, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 14,
              overflow: "hidden",
            }} className="fade-up stagger-3">
              <button
                onClick={() => setGuideExpanded(v => !v)}
                style={{
                  width: "100%", padding: "16px 20px", border: "none", background: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: T.bodyLg }}>{"\u{1F99E}"}</span>
                  Connect with OpenClaw
                </span>
                <span style={{
                  fontSize: T.badge, color: C.textMute,
                  transform: guideExpanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>
                  {"\u25BC"}
                </span>
              </button>
              {guideExpanded && (
                <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.borderLight}` }}>
                  <ol style={{ margin: "16px 0 0", paddingLeft: 20, fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.8 }}>
                    <li>Install the <span style={{ fontFamily: "var(--mono)", fontSize: T.bodySm, background: C.bg, padding: "2px 6px", borderRadius: 4 }}>growthx-bx-submit</span> skill on OpenClaw</li>
                    <li>
                      Set these environment variables in your OpenClaw config:
                      <div style={{
                        marginTop: 8, padding: "12px 14px", background: C.bg,
                        borderRadius: 8, fontFamily: "var(--mono)", fontSize: T.bodySm,
                        lineHeight: 1.8, color: C.text, border: `1px solid ${C.borderLight}`,
                      }}>
                        <div>GROWTHX_API_KEY = <span style={{ color: C.textMute }}>&lt;your key&gt;</span></div>
                        <div>GROWTHX_API_URL = <span style={{ color: C.blue }}>https://api.growthx.club</span></div>
                      </div>
                    </li>
                    <li>Ask OpenClaw: <span style={{ fontStyle: "italic", color: C.text }}>&quot;Push my project to Built at GrowthX&quot;</span></li>
                  </ol>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* ---- Create Key Modal ---- */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setShowCreateModal(false)} style={{
            position: "absolute", inset: 0,
            background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
            animation: "fadeIn 0.2s ease",
          }} />
          <div className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 420,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            padding: "32px 28px",
            animation: "fadeUp 0.25s ease-out",
          }}>
            <button onClick={() => setShowCreateModal(false)} style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              fontSize: T.subtitle, color: C.textMute, lineHeight: 1,
            }}>{"\u00D7"}</button>

            <h2 style={{ fontSize: T.title, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", marginBottom: 6 }}>
              Create API key
            </h2>
            <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", marginBottom: 20 }}>
              Give your key a name to remember what it&apos;s used for.
            </p>

            <label style={{ fontSize: T.label, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 6, display: "block" }}>
              Key name
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value.slice(0, 50))}
              onKeyDown={e => { if (e.key === "Enter") handleCreateKey(); }}
              placeholder="e.g. My OpenClaw key"
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.bg,
                fontSize: T.body, fontFamily: "var(--sans)", color: C.text,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.12s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = C.accent}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 16 }}>
              <span />
              <span style={{
                fontSize: T.caption, fontFamily: "var(--sans)",
                color: newKeyName.length > 40 ? C.gold : C.textMute,
              }}>
                {newKeyName.length}/50
              </span>
            </div>

            {createError && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                background: "#FEF2F2", border: "1px solid #FECACA",
                fontSize: T.bodySm, color: "#B91C1C", fontFamily: "var(--sans)",
              }}>
                {createError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCreateModal(false)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
                cursor: "pointer", fontFamily: "var(--sans)",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
              >
                Cancel
              </button>
              <button onClick={handleCreateKey} disabled={!newKeyName.trim() || creating} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: "none", background: !newKeyName.trim() ? C.borderLight : C.accent,
                fontSize: T.bodySm, fontWeight: 600, color: !newKeyName.trim() ? C.textMute : "#fff",
                cursor: !newKeyName.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--sans)", transition: "opacity 0.12s",
              }}
              onMouseEnter={e => { if (newKeyName.trim()) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {creating ? "Creating\u2026" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Key Reveal Modal (one-time) ---- */}
      {showRevealModal && revealedKey && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
            animation: "fadeIn 0.2s ease",
          }} />
          <div className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 480,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            padding: "32px 28px",
            animation: "fadeUp 0.25s ease-out",
          }}>
            <h2 style={{ fontSize: T.title, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", marginBottom: 6 }}>
              API key created
            </h2>
            <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", marginBottom: 20 }}>
              Copy your API key now. It will not be shown again.
            </p>

            {/* Key display */}
            <div style={{
              padding: "14px 16px", background: C.bg, borderRadius: 10,
              border: `1px solid ${C.border}`, fontFamily: "var(--mono)",
              fontSize: T.bodySm, color: C.text, wordBreak: "break-all",
              userSelect: "all", lineHeight: 1.5, marginBottom: 12,
            }}>
              {revealedKey}
            </div>

            {/* Copy button */}
            <button onClick={() => copyToClipboard(revealedKey)} style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              border: "none", background: copied ? C.green : C.accent,
              fontSize: T.bodySm, fontWeight: 600, color: "#fff",
              cursor: "pointer", fontFamily: "var(--sans)",
              transition: "all 0.15s", marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy to clipboard
                </>
              )}
            </button>

            {/* Warning */}
            <div style={{
              padding: "12px 14px", borderRadius: 10, marginBottom: 20,
              background: C.goldSoft, border: `1px solid ${C.goldBorder}`,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ fontSize: T.bodyLg, flexShrink: 0, marginTop: 1 }}>{"\u26A0\uFE0F"}</span>
              <span style={{ fontSize: T.bodySm, color: C.gold, fontFamily: "var(--sans)", lineHeight: 1.5, fontWeight: 500 }}>
                This key will not be shown again. Make sure you&apos;ve copied it before closing this dialog.
              </span>
            </div>

            {/* Done button */}
            <button onClick={() => { setShowRevealModal(false); setRevealedKey(null); setCopied(false); }} style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface,
              fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
              cursor: "pointer", fontFamily: "var(--sans)",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ---- Revoke Confirmation Modal ---- */}
      {revokeTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setRevokeTarget(null)} style={{
            position: "absolute", inset: 0,
            background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
            animation: "fadeIn 0.2s ease",
          }} />
          <div className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 400,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            padding: "32px 28px",
            animation: "fadeUp 0.25s ease-out",
          }}>
            <button onClick={() => setRevokeTarget(null)} style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              fontSize: T.subtitle, color: C.textMute, lineHeight: 1,
            }}>{"\u00D7"}</button>

            <h2 style={{ fontSize: T.title, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", marginBottom: 6 }}>
              Revoke API key
            </h2>
            <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.5, marginBottom: 20 }}>
              Revoke <strong style={{ color: C.text }}>{revokeTarget.name}</strong>? Any agents using this key will stop working immediately.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRevokeTarget(null)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
                cursor: "pointer", fontFamily: "var(--sans)",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
              >
                Cancel
              </button>
              <button onClick={handleRevokeKey} disabled={revoking} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: "none", background: "#DC2626",
                fontSize: T.bodySm, fontWeight: 600, color: "#fff",
                cursor: revoking ? "not-allowed" : "pointer",
                fontFamily: "var(--sans)", transition: "opacity 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {revoking ? "Revoking\u2026" : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
