import { useState, useEffect, useCallback } from "react";
import { Link, type MetaFunction } from "react-router";
import { C, T, type SkillSubmission, normalizeSubmission } from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import { formatBytes } from "@/components/SkillUse";

export const meta: MetaFunction = () => [
  { title: "Review skills — Built at GrowthX" },
  { name: "robots", content: "noindex" },
];

// Page frame and cards from my-projects.tsx; button looks from skills.new.tsx.
const cardStyle = { padding: "20px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 } as const;
const body = { fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55 } as const;
const meta2 = { fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", lineHeight: 1.4 } as const;
const primary = {
  padding: "8px 16px", borderRadius: 10, border: "none", background: C.accent, color: C.accentFg,
  fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)", cursor: "pointer",
} as const;
const outlined = {
  padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text,
  fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)", cursor: "pointer",
} as const;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type Outcome = { approved: boolean; slug: string | null };

const pre = {
  maxHeight: 480, overflow: "auto", margin: 0, padding: "14px 16px", borderRadius: 10,
  background: C.bg, border: `1px solid ${C.borderLight}`, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
  fontSize: T.label, lineHeight: 1.55, fontFamily: "var(--mono)", color: C.text,
} as const;

/** One file of the upload, folded; SKILL.md starts open. The exact text, so the team reads what members install. */
function FileView({ path, text, size }: { path: string; text: string | null; size?: number }) {
  const [open, setOpen] = useState(/(^|\/)SKILL\.md$/.test(path));
  return (
    <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          padding: "10px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: T.bodySm, fontFamily: "var(--mono)", color: C.text, overflowWrap: "anywhere" }}>{path}</span>
        <span style={{ ...meta2, flexShrink: 0 }}>{size !== undefined ? `${formatBytes(size)} · ` : ""}{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 12 }}>
          {text === null ? <p style={meta2}>Binary file, not shown</p> : <pre style={pre}>{text || "This file is empty."}</pre>}
        </div>
      )}
    </div>
  );
}

function PendingSkill({ s, onDone }: { s: SkillSubmission; onDone: (o: Outcome) => void }) {
  const [full, setFull] = useState<SkillSubmission | null>(null);
  const [open, setOpen] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const size = s.files.reduce((n, f) => n + f.size, 0);

  const toggle = () => {
    setOpen(o => !o);
    if (!full) {
      bxApi(`/skills/submissions/${s.id}`).then(r => r.json()).then(d => setFull(normalizeSubmission(d.submission || {}))).catch(() => setError("Couldn't load the skill. Try again."));
    }
  };

  const review = async (approve: boolean) => {
    if (busy) return;
    if (!approve && !note.trim()) { setError("Say what they should change, so they can fix it."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await bxApi(`/skills/submissions/${s.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approve ? { approve } : { approve, note: note.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.message || "That didn't go through. Try again."); return; }
      onDone({ approved: approve, slug: normalizeSubmission(d.submission || {}).projectSlug });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: T.body, fontWeight: 600, color: C.text }}>{s.title || s.name}</div>
          <p style={body}>{s.tagline || s.description}</p>
        </div>
        <button onClick={toggle} style={{ ...outlined, flexShrink: 0 }}>{open ? "Close" : "Read it"}</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {s.user?.avatarUrl && <img src={s.user.avatarUrl} alt="" width={20} height={20} style={{ borderRadius: 20, objectFit: "cover" }} />}
        <span style={meta2}>
          {s.user?.name ?? "A GrowthX member"} · uploaded {date(s.createdAt)} · {s.category} · {s.files.length} file{s.files.length === 1 ? "" : "s"}, {formatBytes(size)}
          {s.sourceUrl && <> · <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.textSec, textDecoration: "underline", textUnderlineOffset: 2 }}>GitHub</a></>}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          <p style={{ ...body, marginBottom: 6 }}><strong style={{ color: C.text, fontWeight: 600 }}>{s.name}</strong>: {s.description}</p>
          {/* Every file's exact text, front matter included: a reviewer should see what the agent will read. */}
          {!full ? (
            <p style={meta2}>Loading…</p>
          ) : full.contents ? (
            <div style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              {full.contents.map(c => (
                <FileView key={c.path} path={c.path} text={c.text}
                  size={s.files.find(f => f.path === c.path || f.path.endsWith(`/${c.path}`))?.size} />
              ))}
            </div>
          ) : (
            <pre style={pre}>{full.instructions || "This skill has no text."}</pre>
          )}

          {sendingBack && (
            <div style={{ marginTop: 14 }}>
              <label htmlFor={`note-${s.id}`} style={{ display: "block", fontSize: T.bodySm, fontWeight: 500, color: C.text, marginBottom: 6 }}>
                What should they change?
              </label>
              <textarea
                id={`note-${s.id}`} value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={1000}
                style={{
                  width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: T.body,
                  color: C.text, background: C.surface, outline: "none", fontFamily: "var(--sans)", resize: "vertical",
                }}
              />
            </div>
          )}

          {error && <p style={{ ...body, color: C.errorText, marginTop: 10 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {sendingBack ? (
              <>
                <button onClick={() => review(false)} disabled={busy} style={primary}>{busy ? "Sending…" : "Send back"}</button>
                <button onClick={() => { setSendingBack(false); setError(""); }} style={outlined}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => review(true)} disabled={busy || !full} style={{ ...primary, opacity: full ? 1 : 0.5 }}>{busy ? "Approving…" : "Approve"}</button>
                <button onClick={() => setSendingBack(true)} style={outlined}>Send back</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewSkillsPage() {
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride } = useNavOverride();
  const { isMobile } = useResponsive();
  const [state, setState] = useState<"loading" | "signed-out" | "not-team" | "ready">("loading");
  const [pending, setPending] = useState<SkillSubmission[]>([]);
  const [done, setDone] = useState<(Outcome & { name: string })[]>([]);

  const load = useCallback(() => {
    bxApi("/skills/submissions?pending=true").then(async r => {
      if (r.status === 401) { setState("signed-out"); return; }
      if (!r.ok) { setState("not-team"); return; }
      const d = await r.json();
      setPending((d.submissions || []).map(normalizeSubmission));
      setState("ready");
    }).catch(() => setState("not-team"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (state === "signed-out") openLoginDialog(load); }, [state, openLoginDialog, load]);
  useEffect(() => {
    setNavOverride({ title: "Review skills", backHref: "/skills" });
    return () => clearNavOverride();
  }, [setNavOverride, clearNavOverride]);

  return (
    <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px", fontFamily: "var(--sans)" }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: isMobile ? T.heading : T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
          Review skills
        </h1>
        <p style={{ fontSize: T.body, color: C.textSec, maxWidth: 600 }}>
          Read each skill as an agent would. Approve it to list it under the maker&apos;s name, or send it back with a note.
        </p>
      </div>

      {state === "signed-out" && <p style={body}>Sign in with your GrowthX team account to review skills.</p>}
      {state === "not-team" && <p style={body}>Only the GrowthX team can review skills.</p>}

      {state === "ready" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
          {done.map((o, i) => (
            <p key={i} style={{ ...body, padding: "10px 14px", borderRadius: 10, background: o.approved ? C.greenSoft : C.bg, color: o.approved ? C.green : C.textSec }}>
              {o.approved ? <>{o.name} is live{o.slug && <> · <Link to={`/projects/${o.slug}`} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>see it</Link></>}</> : <>{o.name} went back to its maker with your note.</>}
            </p>
          ))}
          {pending.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}>
              <p style={{ fontSize: T.bodyLg, color: C.textSec }}>Nothing waiting. New uploads show up here.</p>
            </div>
          ) : (
            pending.map(s => (
              <PendingSkill
                key={s.id}
                s={s}
                onDone={o => {
                  setPending(list => list.filter(x => x.id !== s.id));
                  setDone(list => [{ ...o, name: s.title || s.name }, ...list]);
                }}
              />
            ))
          )}
        </div>
      )}
    </main>
  );
}
