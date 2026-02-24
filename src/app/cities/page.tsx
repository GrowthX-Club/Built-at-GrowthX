"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  ROLES,
  type CityData,
  type BuilderProfile,
  normalizeUser,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";

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

// ---- Nav Tabs ----

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

// ---- Page ----

export default function CitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [cities, setCities] = useState<CityData[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bxApi("/cities").then((r) => r.json()).then((d) => setCities(d.cities || []));
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignIn = () => { router.push("/login"); };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.9)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 32px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <span
              onClick={() => router.push("/")}
              style={{
                fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
                color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
              }}
            >
              Built
            </span>
            <div style={{ display: "flex", gap: 0 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => router.push(t.href)} style={{
                  padding: "18px 18px", border: "none", background: "none",
                  fontSize: 13.5, fontWeight: pathname === t.href ? 600 : 400,
                  color: pathname === t.href ? C.text : C.textMute,
                  fontFamily: "var(--sans)",
                  borderBottom: pathname === t.href ? `2px solid ${C.text}` : "2px solid transparent",
                  transition: "all 0.15s", letterSpacing: "0.005em",
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={{
              padding: "8px 18px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface,
              fontSize: 12.5, fontWeight: 550, color: C.textSec,
              cursor: "pointer", fontFamily: "var(--sans)",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            onClick={() => router.push("/")}
            >
              Submit project
            </button>
            {user ? (
              <div ref={profileMenuRef} style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Av initials={user.avatar} size={32} role={user.role} src={user.avatarUrl} />
                  <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500, fontFamily: "var(--sans)" }}>{user.name.split(" ")[0]}</span>
                  <span style={{ fontSize: 9, color: C.textMute, transform: showProfileMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>{"\u25BC"}</span>
                </button>
                {showProfileMenu && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 100,
                  }}>
                    <button onClick={() => { setShowProfileMenu(false); router.push("/my-projects"); }} style={{
                      width: "100%", padding: "12px 16px", border: "none", background: "none",
                      fontSize: 13, fontWeight: 500, color: C.text,
                      fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 14 }}>{"\u{1F4E6}"}</span> My Projects
                    </button>
                    <div style={{ height: 1, background: C.borderLight }} />
                    <button onClick={handleSignOut} style={{
                      width: "100%", padding: "12px 16px", border: "none", background: "none",
                      fontSize: 13, fontWeight: 500, color: "#B91C1C",
                      fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 14 }}>{"\u{1F6AA}"}</span> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleSignIn} style={{
                padding: "8px 18px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 12.5, fontWeight: 550, color: C.textSec,
                fontFamily: "var(--sans)",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        {/* <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            Where India builds
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            {cities.length} {cities.length === 1 ? "city" : "cities"}. One leaderboard. Ranked by shipping velocity, weighted by project quality.
          </p>
        </div> */}

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cities.length === 0 && (
            <p style={{ fontSize: 14, color: C.textMute, padding: "40px 0", textAlign: "center" }}>
              No cities yet. Ship a project to put your city on the map.
            </p>
          )}
          {cities.map((city, i) => (
            <div key={city.name} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
              padding: "18px 24px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 14,
              marginBottom: 6,
              display: "flex", gap: 16, alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                fontSize: 15, fontWeight: 700, color: i < 3 ? C.text : C.textMute,
                fontFamily: "var(--sans)", width: 28, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{city.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 550, color: C.text, fontFamily: "var(--sans)", marginBottom: 2 }}>
                  {city.name}
                </div>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>{city.trend}</div>
              </div>
              <div style={{ display: "flex", gap: 32, fontSize: 13, fontFamily: "var(--sans)" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1 }}>
                    {city.builders.toLocaleString()}
                  </div>
                  <div style={{ color: C.textMute, fontSize: 11, marginTop: 2 }}>builders</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1 }}>
                    {city.shipped}
                  </div>
                  <div style={{ color: C.textMute, fontSize: 11, marginTop: 2 }}>shipped</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
