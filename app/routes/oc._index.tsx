import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { MetaFunction } from "react-router";
import { C, T, type Project, normalizeProject } from "@/types";
import { bxApi } from "@/lib/api";
import OCLockedGallery from "../components/OCLockedGallery";

export const meta: MetaFunction = () => [
  { title: "OpenCode Buildathon — Built at GrowthX" },
  {
    name: "description",
    content:
      "Browse projects from India's first Open Code Buildathon — submit yours to unlock the gallery.",
  },
  { property: "og:title", content: "OpenCode Buildathon — Built at GrowthX" },
  {
    property: "og:description",
    content:
      "Browse projects from India's first Open Code Buildathon — submit yours to unlock the gallery.",
  },
];

type LoadState = "idle" | "loading" | "locked" | "unlocked";

/**
 * /oc home.
 *
 * Locked gallery shown when:
 *  - viewer not logged in
 *  - logged-in viewer has no published (non-draft, enabled) project
 *
 * Unlocked gallery (real /projects?sort=new feed) shown when the viewer
 * has at least one published project. Own projects float to the top.
 *
 * No useEffect — fetches are kicked off in a ref-guarded one-shot at
 * render time, gated on `typeof window` to skip SSR.
 */
export default function OCHome() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>("idle");
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [anyMineCount, setAnyMineCount] = useState(0);

  const didFetchRef = useRef(false);
  if (typeof window !== "undefined" && !didFetchRef.current) {
    didFetchRef.current = true;
    setState("loading");

    // Step 1: fetch the viewer's own projects. If the /me-gated endpoint
    // rejects (401) or returns nothing eligible, we stay locked.
    bxApi("/my-projects")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => {
        const list: Project[] = (d.projects || []).map(
          (p: Record<string, unknown>) => normalizeProject(p),
        );
        setAnyMineCount(list.length);
        const published = list.filter((p) => !p.isDraft && p.enabled);
        if (published.length === 0) {
          setMyProjects([]);
          setState("locked");
          return;
        }
        setMyProjects(published);
        // Step 2: viewer is unlocked — fetch the wider feed.
        bxApi("/projects?sort=new")
          .then((r) => (r.ok ? r.json() : { projects: [] }))
          .then((d2) => {
            const all: Project[] = (d2.projects || []).map(
              (p: Record<string, unknown>) => normalizeProject(p),
            );
            setAllProjects(all);
            setState("unlocked");
          })
          .catch(() => {
            setAllProjects([]);
            setState("unlocked");
          });
      })
      .catch(() => setState("locked"));
  }

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "clamp(28px, 6vw, 56px) clamp(16px, 4vw, 32px) 24px",
      }}
    >
      {/* Hero */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
          maxWidth: 760,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: T.badge,
            fontWeight: 500,
            color: C.textMute,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: C.surfaceWarm,
          }}
        >
          India&rsquo;s first Open Code Buildathon
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--serif)",
            fontSize: "clamp(32px, 5.2vw, 48px)",
            fontWeight: 500,
            color: C.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Ship something this weekend.
          <br />
          Put it up for the community to see.
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--sans)",
            fontSize: T.bodyLg,
            color: C.textSec,
            lineHeight: 1.55,
            maxWidth: 600,
          }}
        >
          Solo or with a team. When you submit, the gallery unlocks and you
          can upvote what the rest of the cohort built.
        </p>

        {anyMineCount > 0 ? (
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--sans)",
              fontSize: T.bodyLg,
              color: C.text,
              lineHeight: 1.55,
            }}
          >
            You&rsquo;ve already submitted a project.{" "}
            <Link
              to="/my-projects"
              style={{
                color: C.text,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontWeight: 600,
              }}
            >
              View it here
            </Link>{" "}
            or{" "}
            <Link
              to="/oc/submit"
              style={{
                color: C.text,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontWeight: 600,
              }}
            >
              create a new one
            </Link>
            .
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/oc/submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 10,
                background: C.accent,
                color: C.accentFg,
                fontFamily: "var(--sans)",
                fontSize: T.bodySm,
                fontWeight: 600,
                textDecoration: "none",
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(24,23,16,0.18)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Submit your project
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: T.label,
                color: C.textMute,
              }}
            >
              Takes under two minutes &middot; drafts welcome
            </span>
          </div>
        )}
      </section>

      {state === "unlocked" ? (
        <UnlockedGallery
          myProjects={myProjects}
          allProjects={allProjects}
          onOpen={(p) => navigate(`/projects/${p.slug || p.id}`)}
        />
      ) : state === "locked" ? (
        <OCLockedGallery />
      ) : (
        <GallerySkeleton />
      )}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <section
      aria-hidden
      style={{
        marginTop: 32,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 14,
            padding: 20,
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ height: 16, width: "60%" }} />
              <div className="skeleton" style={{ height: 12, width: "90%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
            <div className="skeleton" style={{ height: 20, width: 48, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 20, width: 36, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </section>
  );
}

/** Real gallery shown to viewers who have at least one published project. */
function UnlockedGallery({
  myProjects,
  allProjects,
  onOpen,
}: {
  myProjects: Project[];
  allProjects: Project[];
  onOpen: (p: Project) => void;
}) {
  // De-dupe: own projects always float to top; filter them out of the wider
  // feed so we don't render twice.
  const myIds = new Set(myProjects.map((p) => String(p.id)));
  const others = allProjects.filter((p) => !myIds.has(String(p.id)));
  const ordered: Project[] = [...myProjects, ...others];

  return (
    <section style={{ marginTop: 32 }}>
      {ordered.length === 0 ? (
        <div
          style={{
            padding: "48px 32px",
            textAlign: "center",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
          }}
        >
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.bodyLg,
              color: C.textSec,
              margin: 0,
            }}
          >
            You&rsquo;re in. More builds will land here as the cohort ships.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {ordered.map((p) => (
            <ProjectCard
              key={String(p.id)}
              project={p}
              isMine={myIds.has(String(p.id))}
              onOpen={() => onOpen(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Real project card — visually aligned with the locked gallery's FakeCard
 * so the transition from locked → unlocked feels seamless.
 */
function ProjectCard({
  project,
  isMine,
  onOpen,
}: {
  project: Project;
  isMine: boolean;
  onOpen: () => void;
}) {
  const initials =
    (project.builder?.name || "")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const accent = project.heroColor || C.accent;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        all: "unset",
        cursor: "pointer",
        background: C.surface,
        border: `1px solid ${isMine ? C.accent : C.borderLight}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 180,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(24,23,16,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isMine && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontFamily: "var(--mono)",
            fontSize: T.micro,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: C.accent,
            background: C.accentSoft,
            padding: "3px 7px",
            borderRadius: 6,
          }}
        >
          Yours
        </span>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {project.builder?.avatarUrl ? (
          <img
            src={project.builder.avatarUrl}
            alt={project.builder.name}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
              background: accent,
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: accent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--sans)",
              fontSize: T.bodySm,
              fontWeight: 700,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.bodyLg,
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.25,
              marginBottom: 4,
              paddingRight: isMine ? 56 : 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.name}
          </div>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.label,
              color: C.textSec,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {project.tagline}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(project.stack || []).slice(0, 2).map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.micro,
                color: C.textSec,
                background: C.accentSoft,
                padding: "3px 8px",
                borderRadius: 6,
                letterSpacing: "0.02em",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            fontFamily: "var(--sans)",
            fontSize: T.label,
            fontWeight: 600,
            color: C.textSec,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" />
          </svg>
          {project.weighted ?? 0}
        </div>
      </div>
    </button>
  );
}
