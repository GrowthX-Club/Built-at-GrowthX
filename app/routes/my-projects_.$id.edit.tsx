import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { C, T, type Project, normalizeProject } from "@/types";
import { bxApi } from "@/lib/api";
import { useNavOverride } from "@/context/NavContext";
import ProjectEditor, {
  projectToSubmitData,
  type SubmitData,
} from "../components/ProjectEditor";

/**
 * /my-projects/:id/edit — full-page edit route for an existing project.
 *
 * Replaces the modal edit flow that used SubmitWizard. Layout is owned by
 * <ProjectEditor>; this route handles the project fetch + loading/not-found
 * states.
 *
 * No useEffect: initial load uses the one-shot ref-guard pattern gated on
 * `typeof window`. Route is auto-registered by `flatRoutes()` in
 * app/routes.ts.
 */
export default function MyProjectEditRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setNavOverride } = useNavOverride();

  const [project, setProject] = useState<Project | null>(null);
  const [initialData, setInitialData] = useState<SubmitData | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error" | "notfound">("idle");

  // One-shot nav override — back chevron returns to /my-projects so the
  // drafts list → edit → back chain lands where the user came from.
  // /my-projects itself re-sets the override on mount, so no cleanup needed.
  // Deferred via queueMicrotask so we don't setState on NavProvider during render.
  const didSetNavRef = useRef(false);
  if (!didSetNavRef.current) {
    didSetNavRef.current = true;
    queueMicrotask(() => setNavOverride({ title: "Edit project", backHref: "/my-projects" }));
  }

  // One-shot project fetch — no useEffect. Ref guard prevents a second fetch
  // under React strict mode. Gated on window to skip the SSR pass.
  const didLoadRef = useRef(false);
  if (typeof window !== "undefined" && !didLoadRef.current && id) {
    didLoadRef.current = true;
    setLoadState("loading");
    bxApi("/my-projects")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        const found = list.find((p: Project) => String(p.id) === String(id)) ?? null;
        if (!found) {
          setLoadState("notfound");
          return;
        }
        setProject(found);
        setInitialData(projectToSubmitData(found));
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }

  if (loadState === "notfound") {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", fontFamily: "var(--sans)" }}>
        <div style={{
          padding: "48px 32px", textAlign: "center",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        }}>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, marginBottom: 16 }}>
            We couldn&rsquo;t find that project.
          </p>
          <button
            onClick={() => navigate("/my-projects")}
            style={{
              padding: "10px 24px", borderRadius: 10,
              border: "none", background: C.accent, color: C.accentFg,
              fontSize: T.body, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
            }}
          >
            Back to my projects
          </button>
        </div>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", fontFamily: "var(--sans)" }}>
        <div style={{
          padding: "48px 32px", textAlign: "center",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        }}>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, marginBottom: 16 }}>
            Something went wrong loading this project.
          </p>
          <button
            onClick={() => navigate("/my-projects")}
            style={{
              padding: "10px 24px", borderRadius: 10,
              border: "none", background: C.accent, color: C.accentFg,
              fontSize: T.body, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
            }}
          >
            Back to my projects
          </button>
        </div>
      </main>
    );
  }

  if (loadState !== "ready" || !project || !initialData) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "var(--sans)" }}>
        <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 14, width: "70%" }} />
      </main>
    );
  }

  return (
    <ProjectEditor
      projectId={project.id}
      initialData={initialData}
    />
  );
}
