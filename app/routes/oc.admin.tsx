import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { MetaFunction } from "react-router";
import {
  C,
  T,
  TRACK_LABELS,
  type Project,
  type TrackKey,
  type TrackData,
  normalizeProject,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";

export const meta: MetaFunction = () => [
  { title: "Admin · OpenCode projects — Built at GrowthX" },
  { name: "robots", content: "noindex,nofollow" },
];

type LoadState = "idle" | "loading" | "ready" | "error";
type FilterKey = "all" | "published" | "drafts";

// Row shape: Project fields + a few raw fields (primaryTrack, secondaryTracks, trackData)
// that normalizeProject drops. We re-attach them from the raw backend payload.
interface AdminRow extends Project {
  primaryTrack?: TrackKey;
  secondaryTracks?: TrackKey[];
  trackData?: TrackData;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return "";
}

/** Collapse a row to the canonical "live URL" (live > demo > video > url). */
function liveUrlFor(r: AdminRow): string {
  return firstString(r.url, r.demoUrl, r.videoUrl);
}

/** Format a date to YYYY-MM-DD (falls back to the raw string on parse fail). */
function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function statusLabel(r: AdminRow): { label: string; bg: string; fg: string } {
  if (r.isDraft) return { label: "Draft", bg: C.goldSoft, fg: C.gold };
  if (!r.enabled) return { label: "Hidden", bg: C.borderLight, fg: C.textMute };
  return { label: "Live", bg: C.greenSoft, fg: C.green };
}

/** RFC-4180-ish CSV escape: wrap in quotes if contains comma/quote/newline; double internal quotes. */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build CSV text for the given rows. Includes flat project fields + flattened trackData. */
function buildCsv(rows: AdminRow[]): string {
  const headers = [
    "id",
    "name",
    "tagline",
    "builder",
    "primaryTrack",
    "secondaryTracks",
    "status",
    "enabled",
    "weighted",
    "raw",
    "date",
    "category",
    "stack",
    "githubUrl",
    "liveUrl",
    "videoUrl",
    "description",
    // virality
    "virality.uniqueVisitors",
    "virality.signupsCount",
    "virality.impressionsTotal",
    "virality.reactionsTotal",
    "virality.analyticsProvider",
    "virality.analyticsReadOnlyUrl",
    // revenue
    "revenue.tractionStage",
    "revenue.tractionDetails",
    "revenue.painPoint",
    "revenue.marketSize",
    "revenue.rightToWin",
    "revenue.whyNow",
    "revenue.moat",
    // maas
    "maas.realOutput.tier",
    "maas.realOutput.taskDomain",
    "maas.realOutput.surfaceUrl",
    "maas.realOutput.overflowCount",
    "maas.orgStructure.tier",
    "maas.observability.tier",
    "maas.observability.tool",
    "maas.evals.tier",
    "maas.evals.ciUrl",
    "maas.evals.notes",
    "maas.memory.tier",
    "maas.memory.architecture",
    "maas.costLatency.tier",
    "maas.costLatency.timePerTask",
    "maas.costLatency.costPerTask",
    "maas.managementUi.tier",
    "maas.managementUi.url",
  ];

  const lines: string[] = [headers.join(",")];
  for (const r of rows) {
    const status = r.isDraft ? "draft" : r.enabled ? "live" : "hidden";
    const td = r.trackData || {};
    const v = td.virality || {};
    const rv = td.revenue || {};
    const m = td.maas || {};
    const cells: unknown[] = [
      r.id,
      r.name,
      r.tagline,
      r.builder?.name || "",
      r.primaryTrack || "",
      (r.secondaryTracks || []).join("|"),
      status,
      r.enabled ? "true" : "false",
      r.weighted ?? 0,
      r.raw ?? 0,
      fmtDate(r.date),
      r.category || "",
      (r.stack || []).join("|"),
      r.githubUrl || "",
      liveUrlFor(r),
      r.videoUrl || "",
      r.description || "",
      v.uniqueVisitors || "",
      v.signupsCount || "",
      v.impressionsTotal || "",
      v.reactionsTotal || "",
      v.analyticsProvider || "",
      v.analyticsReadOnlyUrl || "",
      rv.tractionStage || "",
      rv.tractionDetails || "",
      rv.painPoint || "",
      rv.marketSize || "",
      rv.rightToWin || "",
      rv.whyNow || "",
      rv.moat || "",
      m.realOutput?.tier || "",
      m.realOutput?.taskDomain || "",
      m.realOutput?.surfaceUrl || "",
      m.realOutput?.overflowCount ?? "",
      m.orgStructure?.tier || "",
      m.observability?.tier || "",
      m.observability?.tool || "",
      m.evals?.tier || "",
      m.evals?.ciUrl || "",
      m.evals?.notes || "",
      m.memory?.tier || "",
      m.memory?.architecture || "",
      m.costLatency?.tier || "",
      m.costLatency?.timePerTask || "",
      m.costLatency?.costPerTask || "",
      m.managementUi?.tier || "",
      m.managementUi?.url || "",
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(text: string, filename: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick so the click completes first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Normalize and re-attach admin-only fields (tracks + github/demo URLs). */
function normalizeAdminRow(raw: Record<string, unknown>): AdminRow {
  const base = normalizeProject(raw) as AdminRow;
  const VALID: TrackKey[] = ["virality", "revenue", "maas"];
  const pt = raw.primaryTrack;
  if (typeof pt === "string" && VALID.includes(pt as TrackKey)) {
    base.primaryTrack = pt as TrackKey;
  }
  const st = Array.isArray(raw.secondaryTracks) ? raw.secondaryTracks : [];
  base.secondaryTracks = st.filter(
    (t): t is TrackKey => typeof t === "string" && VALID.includes(t as TrackKey),
  );
  if (raw.trackData && typeof raw.trackData === "object") {
    base.trackData = raw.trackData as TrackData;
  }
  if (typeof raw.githubUrl === "string") base.githubUrl = raw.githubUrl;
  if (typeof raw.demoUrl === "string") base.demoUrl = raw.demoUrl;
  if (typeof raw.videoUrl === "string") base.videoUrl = raw.videoUrl;
  return base;
}

/**
 * /oc/admin — table view of every submitted project with CSV export.
 *
 * Auth gate: same as /my-projects — we just need a logged-in user for now.
 * A real gx-admin role check is out of scope and lives on the backend.
 *
 * No useEffect: data is fetched in a ref-guarded one-shot at render time,
 * guarded on `typeof window` so SSR doesn't fire it.
 */
export default function OCAdminPage() {
  const navigate = useNavigate();
  const { openLoginDialog } = useLoginDialog();
  const [state, setState] = useState<LoadState>("idle");
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const didFetchRef = useRef(false);
  if (typeof window !== "undefined" && !didFetchRef.current) {
    didFetchRef.current = true;
    setState("loading");

    const load = () => {
      bxApi("/me")
        .then((r) => r.json())
        .then((d) => {
          if (!d.user) {
            openLoginDialog(() => {
              didFetchRef.current = false; // allow another attempt after login
            });
            setState("error");
            return;
          }
          bxApi("/admin/projects")
            .then((r) => (r.ok ? r.json() : { projects: [] }))
            .then((d2) => {
              const list: AdminRow[] = (d2.projects || []).map(
                (p: Record<string, unknown>) => normalizeAdminRow(p),
              );
              setRows(list);
              setState("ready");
            })
            .catch(() => setState("error"));
        })
        .catch(() => setState("error"));
    };
    load();
  }

  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter === "published" && r.isDraft) return false;
    if (filter === "drafts" && !r.isDraft) return false;
    if (!q) return true;
    const hay = [r.name, r.tagline, r.builder?.name || ""]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const onDownload = () => {
    const csv = buildCsv(visible);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `opencode-projects-${stamp}.csv`);
  };

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px) clamp(12px, 3vw, 24px) 80px",
        fontFamily: "var(--sans)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Instrument Serif', var(--serif)",
              fontSize: "clamp(26px, 3.6vw, 34px)",
              fontWeight: 500,
              color: C.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            Admin &middot; OpenCode projects
          </h1>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: T.caption,
              color: C.textMute,
              letterSpacing: "0.02em",
            }}
          >
            {state === "ready" ? `${rows.length} total` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={state !== "ready" || visible.length === 0}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: T.bodySm,
            fontWeight: 600,
            cursor:
              state !== "ready" || visible.length === 0 ? "default" : "pointer",
            opacity: state !== "ready" || visible.length === 0 ? 0.5 : 1,
            transition: "border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            if (state === "ready" && visible.length > 0)
              e.currentTarget.style.borderColor = C.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          Download CSV
        </button>
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, tagline, or builder"
          style={{
            flex: "1 1 240px",
            maxWidth: 360,
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: T.bodySm,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "published", "drafts"] as FilterKey[]).map((k) => {
            const active = filter === k;
            const label =
              k === "all" ? "All" : k === "published" ? "Published" : "Drafts";
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accent : C.surface,
                  color: active ? C.accentFg : C.textSec,
                  fontFamily: "var(--sans)",
                  fontSize: T.caption,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--mono)",
            fontSize: T.caption,
            color: C.textMute,
          }}
        >
          {state === "ready" ? `${visible.length} shown` : ""}
        </span>
      </div>

      {state === "loading" || state === "idle" ? (
        <TableSkeleton />
      ) : state === "error" ? (
        <EmptyState
          text="Couldn't load submissions. You may need to log in first."
        />
      ) : rows.length === 0 ? (
        <EmptyState text="No submissions yet." />
      ) : (
        <ProjectsTable
          rows={visible}
          onOpen={(r) => navigate(`/projects/${r.slug || r.id}`)}
          onEdit={(r) => navigate(`/my-projects/${r.id}/edit`)}
        />
      )}
    </div>
  );
}

function ProjectsTable({
  rows,
  onOpen,
  onEdit,
}: {
  rows: AdminRow[];
  onOpen: (r: AdminRow) => void;
  onEdit: (r: AdminRow) => void;
}) {
  const th: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: C.surfaceWarm,
    color: C.textMute,
    fontFamily: "var(--mono)",
    fontSize: T.micro + 2,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: "nowrap",
    zIndex: 1,
  };
  const td: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: `1px solid ${C.borderLight}`,
    fontFamily: "var(--sans)",
    fontSize: T.label,
    color: C.text,
    verticalAlign: "top",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        overflowX: "auto",
        maxHeight: "70vh",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: C.surface,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Tagline</th>
            <th style={th}>Builder</th>
            <th style={th}>Primary</th>
            <th style={th}>Secondary</th>
            <th style={th}>Status</th>
            <th style={th}>Votes</th>
            <th style={th}>Submitted</th>
            <th style={th}>GitHub</th>
            <th style={th}>Live</th>
            <th style={th}>Stack</th>
            <th style={{ ...th, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={String(r.id)} r={r} onOpen={onOpen} onEdit={onEdit} cellStyle={td} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  r,
  onOpen,
  onEdit,
  cellStyle,
}: {
  r: AdminRow;
  onOpen: (r: AdminRow) => void;
  onEdit: (r: AdminRow) => void;
  cellStyle: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const status = statusLabel(r);
  const live = liveUrlFor(r);
  const tdHover: React.CSSProperties = {
    ...cellStyle,
    background: hover ? C.surfaceWarm : "transparent",
    transition: "background 0.12s",
  };

  // Clicking the row (outside link/button cells) opens detail.
  const rowClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("a, button")) return;
    onOpen(r);
  };

  return (
    <tr
      onClick={rowClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer" }}
    >
      <td style={{ ...tdHover, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
        {r.name || <span style={{ color: C.textMute }}>Untitled</span>}
      </td>
      <td style={{ ...tdHover, color: C.textSec, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
        {r.tagline}
      </td>
      <td style={{ ...tdHover, color: C.textSec, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
        {r.builder?.name || ""}
      </td>
      <td style={tdHover}>
        {r.primaryTrack ? (
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 999,
              background: C.accent,
              color: C.accentFg,
              fontSize: T.micro + 2,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {TRACK_LABELS[r.primaryTrack]}
          </span>
        ) : (
          <span style={{ color: C.textMute }}>—</span>
        )}
      </td>
      <td style={{ ...tdHover, color: C.textSec }}>
        {(r.secondaryTracks || []).map((t) => TRACK_LABELS[t]).join(", ") || (
          <span style={{ color: C.textMute }}>—</span>
        )}
      </td>
      <td style={tdHover}>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 4,
            background: status.bg,
            color: status.fg,
            fontFamily: "var(--mono)",
            fontSize: T.micro + 2,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {status.label}
        </span>
      </td>
      <td style={{ ...tdHover, fontFamily: "var(--mono)", textAlign: "right" }}>
        {r.weighted ?? 0}
      </td>
      <td style={{ ...tdHover, fontFamily: "var(--mono)", color: C.textSec }}>
        {fmtDate(r.date)}
      </td>
      <td style={tdHover}>
        {r.githubUrl ? (
          <a
            href={r.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: C.blue, textDecoration: "none" }}
          >
            GitHub
          </a>
        ) : (
          <span style={{ color: C.textMute }}>—</span>
        )}
      </td>
      <td style={tdHover}>
        {live ? (
          <a
            href={live}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: C.blue, textDecoration: "none" }}
          >
            Open
          </a>
        ) : (
          <span style={{ color: C.textMute }}>—</span>
        )}
      </td>
      <td style={{ ...tdHover, color: C.textSec, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
        {(r.stack || []).join(", ") || <span style={{ color: C.textMute }}>—</span>}
      </td>
      <td style={{ ...tdHover, textAlign: "right" }}>
        <div style={{ display: "inline-flex", gap: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(r);
            }}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontFamily: "var(--sans)",
              fontSize: T.caption,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(r);
            }}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontFamily: "var(--sans)",
              fontSize: T.caption,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: C.surface,
        padding: 12,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "10px 0",
            borderBottom:
              i < 5 ? `1px solid ${C.borderLight}` : "none",
          }}
        >
          <div className="skeleton" style={{ height: 14, width: 160 }} />
          <div className="skeleton" style={{ height: 14, flex: 1 }} />
          <div className="skeleton" style={{ height: 14, width: 80 }} />
          <div className="skeleton" style={{ height: 14, width: 60 }} />
          <div className="skeleton" style={{ height: 14, width: 100 }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "64px 32px",
        textAlign: "center",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--sans)",
          fontSize: T.bodyLg,
          color: C.textSec,
        }}
      >
        {text}
      </p>
    </div>
  );
}
