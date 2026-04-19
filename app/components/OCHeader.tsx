import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { useRouter } from "next/navigation";
import {
  C,
  T,
  ROLES,
  type BuilderProfile,
  normalizeUser,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useTheme } from "@/context/ThemeContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import BuiltLogo from "@/components/BuiltLogo";

/**
 * Branded header for /oc/* routes.
 * Reuses the existing Built-at-GrowthX logo mark and appends an
 * "OpenCode Buildathon" event lockup. The whole lockup is a link to /oc
 * (NEVER to /).
 *
 * Because the global AppNav is CSS-suppressed on /oc (see app/routes/oc.tsx),
 * we render the core auth/user affordances (user menu, theme toggle, sign-in)
 * in a right-side cluster here. These are the same components/contexts the
 * global nav uses — reused as-is so login + auth cookie behaviour is identical.
 */

function Av({
  initials,
  size = 32,
  role,
  src,
}: {
  initials: string;
  size?: number;
  role?: string;
  src?: string;
}) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img
        src={src}
        alt={initials}
        style={{
          width: size,
          height: size,
          borderRadius: size,
          border: `1px solid ${C.borderLight}`,
          flexShrink: 0,
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: r?.bg || C.accentSoft,
        color: r?.color || C.textSec,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.36),
        fontWeight: 650,
        fontFamily: "var(--sans)",
        letterSpacing: "0.01em",
        border: `1px solid ${C.borderLight}`,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function OCHeader() {
  const { isMobile } = useResponsive();
  const { openLoginDialog } = useLoginDialog();
  const { theme, triggerFlip, isAnimating } = useTheme();
  const router = useRouter();

  const logoHeight = isMobile ? 32 : 40;

  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const reloadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  useEffect(() => {
    const handler = () => reloadUser();
    window.addEventListener("bx:login-success", handler);
    return () => window.removeEventListener("bx:login-success", handler);
  }, [reloadUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // LoginDialog is a modal — it stays on the current URL, so the user
  // naturally lands back on /oc after a successful login. The shared
  // .growthx.club cookie + localStorage bx_token are set by gxApi and the
  // "bx:login-success" event re-fetches the user above.
  const handleSignIn = () => {
    openLoginDialog(() => {
      reloadUser();
    });
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
  };

  return (
    <header
      className="oc-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "0 16px" : "0 96px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: isMobile ? 60 : 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          to="/oc"
          aria-label="Open Code Buildathon — Built at GrowthX"
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 14,
            textDecoration: "none",
            color: C.text,
            minWidth: 0,
          }}
        >
          <BuiltLogo height={logoHeight} />
          <span
            aria-hidden
            style={{
              width: 4,
              height: 4,
              borderRadius: 4,
              background: C.textMute,
              flexShrink: 0,
              margin: "0 2px",
            }}
          />
          <span
            style={{
              fontFamily: "'Instrument Serif', var(--serif)",
              fontSize: isMobile ? 20 : 24,
              fontWeight: 400,
              color: C.textMute,
              letterSpacing: "-0.005em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1,
            }}
          >
            OpenCode Buildathon
          </span>
        </Link>

        {/* Right-side affordance cluster — mirrors AppNav styling */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 14,
            flexShrink: 0,
          }}
        >
          {/* Theme toggle */}
          <button
            onClick={triggerFlip}
            disabled={isAnimating}
            aria-label={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            style={{
              width: 32,
              height: 32,
              borderRadius: 32,
              border: `1px solid ${C.border}`,
              background: C.surface,
              cursor: isAnimating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.15s, opacity 0.15s",
              opacity: isAnimating ? 0.5 : 1,
              flexShrink: 0,
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) e.currentTarget.style.borderColor = C.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            {theme === "light" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.textSec}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.textSec}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* User menu (authenticated) OR Sign in button (unauth) */}
          {userLoading ? (
            <div
              style={{ width: 32, height: 32, borderRadius: 32 }}
              className="skeleton"
            />
          ) : user ? (
            <div ref={profileMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfileMenu((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Av
                  initials={user.avatar}
                  size={32}
                  role={user.role}
                  src={user.avatarUrl}
                />
                {!isMobile && (
                  <>
                    <span
                      style={{
                        fontSize: T.label,
                        color: C.textSec,
                        fontWeight: 500,
                        fontFamily: "var(--sans)",
                      }}
                    >
                      {user.name.split(" ")[0]}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: C.textMute,
                        transform: showProfileMenu ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      {"\u25BC"}
                    </span>
                  </>
                )}
              </button>
              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    minWidth: 180,
                    overflow: "hidden",
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push("/my-projects");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: T.bodySm,
                      fontWeight: 500,
                      color: C.text,
                      fontFamily: "var(--sans)",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.accentSoft)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <span style={{ fontSize: T.body }}>{"\u{1F4E6}"}</span> My Projects
                  </button>
                  <div style={{ height: 1, background: C.borderLight }} />
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push("/settings");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: T.bodySm,
                      fontWeight: 500,
                      color: C.text,
                      fontFamily: "var(--sans)",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.accentSoft)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <span style={{ fontSize: T.body }}>{"\u2699\uFE0F"}</span> Settings
                  </button>
                  <div style={{ height: 1, background: C.borderLight }} />
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: T.bodySm,
                      fontWeight: 500,
                      color: C.errorText,
                      fontFamily: "var(--sans)",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.errorSoft)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <span style={{ fontSize: T.body }}>{"\u{1F6AA}"}</span> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                padding: isMobile ? "6px 14px" : "8px 18px",
                borderRadius: isMobile ? 8 : 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                fontSize: isMobile ? T.label : T.bodySm,
                fontWeight: 550,
                color: C.textSec,
                cursor: "pointer",
                fontFamily: "var(--sans)",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.color = C.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.textSec;
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
