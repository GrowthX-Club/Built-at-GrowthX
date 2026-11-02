import { useState, useEffect, useCallback, useRef, type DragEvent } from "react";
import { Link, type MetaFunction } from "react-router";
import { C, T, type BuilderProfile, type SkillSubmission, normalizeUser, normalizeSubmission } from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import { formatBytes } from "@/components/SkillUse";

export const meta: MetaFunction = () => [
  { title: "Upload a skill — Built at GrowthX" },
  { name: "robots", content: "noindex" },
];

const SKILL_CATEGORIES = ["Product", "Design", "Engineering", "Marketing", "Sales", "Writing", "Data", "Productivity", "Learning"];

// Same limits the backend enforces; checked here too so a member hears it before the upload.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 200;
const JUNK = /(^|\/)(\.DS_Store|__MACOSX|\.git|Thumbs\.db)(\/|$)/;

type Picked = { path: string; file: File };
type Choice =
  | { kind: "folder"; files: Picked[]; size: number; name: string; description: string }
  | { kind: "zip"; file: File };

// Styles from SubmitModal.tsx (labels, inputs) and my-projects.tsx (page frame, cards, primary button).
const label = { display: "block", fontSize: T.bodySm, fontWeight: 500, color: C.text, marginBottom: 6, fontFamily: "var(--sans)" } as const;
const input = {
  width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: T.body,
  color: C.text, background: C.surface, outline: "none", fontFamily: "var(--sans)",
} as const;
const cardStyle = { padding: "24px 28px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 } as const;
const body = { fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55 } as const;
const meta2 = { fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", lineHeight: 1.4 } as const;
const outlined = {
  padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text,
  fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)", cursor: "pointer",
} as const;

/** name and description from SKILL.md's front matter, for the preview only; the backend reads it again. */
function readFrontMatter(text: string): { name: string; description: string } {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const field = (key: string) => {
    const m = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(fm);
    if (!m) return "";
    let v = m[1].trim();
    if (v === ">" || v === "|" || v === ">-" || v === "|-") {
      // A folded value: the indented lines after it.
      const after = fm.slice(m.index + m[0].length).split(/\r?\n/).slice(1);
      v = after.slice(0, after.findIndex(l => !/^\s+\S/.test(l)) >>> 0).map(l => l.trim()).join(" ");
    }
    return v.replace(/^["']|["']$/g, "");
  };
  return { name: field("name"), description: field("description") };
}

// The backend's defaults when title / tagline are left empty, so the prefill matches what would be listed anyway.
const titleFrom = (name: string) => name.replace(/[-_]+/g, " ").replace(/^\w/, c => c.toUpperCase()).slice(0, 80);
const taglineFrom = (description: string) => (/^.*?[.!?](\s|$)/.exec(description)?.[0] ?? description).trim().slice(0, 200);

function walk(entry: FileSystemEntry, prefix: string): Promise<Picked[]> {
  if (entry.isFile) {
    return new Promise((resolve, reject) =>
      (entry as FileSystemFileEntry).file(file => resolve([{ path: prefix + entry.name, file }]), reject));
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const all: FileSystemEntry[] = [];
  return new Promise((resolve, reject) => {
    const next = () => reader.readEntries(async batch => {
      if (batch.length) { all.push(...batch); next(); return; }
      resolve((await Promise.all(all.map(e => walk(e, `${prefix}${entry.name}/`)))).flat());
    }, reject);
    next();
  });
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(s);
}

/** A folder's files → the preview, or the plain-words reason it can't be uploaded. */
async function readFolder(all: Picked[]): Promise<Choice | string> {
  const files = all.filter(f => !JUNK.test(f.path));
  const skillMd = files.filter(f => /(^|\/)SKILL\.md$/.test(f.path)).sort((a, b) => a.path.length - b.path.length)[0];
  if (!skillMd) return "That folder has no SKILL.md file. A skill is a folder with SKILL.md at the top.";
  const size = files.reduce((n, f) => n + f.file.size, 0);
  if (files.length > MAX_FILES) return `Skills can have up to ${MAX_FILES} files. This folder has ${files.length}.`;
  if (size > MAX_BYTES) return `Skills can be up to 4 MB. This folder is ${formatBytes(size)}.`;
  const { name, description } = readFrontMatter(await skillMd.file.text());
  if (!name || !description) return "SKILL.md needs a name and a description at the top, between two --- lines.";
  return { kind: "folder", files, size, name, description };
}

function StatusPill({ status }: { status: SkillSubmission["status"] }) {
  const look = {
    pending: { bg: C.goldSoft, fg: C.gold, text: "Waiting for GrowthX to check it" },
    approved: { bg: C.greenSoft, fg: C.green, text: "Live" },
    sent_back: { bg: C.errorSoft, fg: C.errorText, text: "Sent back" },
  }[status];
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, background: look.bg, color: look.fg, whiteSpace: "nowrap",
      fontSize: T.label, fontWeight: 600, fontFamily: "var(--sans)", flexShrink: 0,
    }}>
      {look.text}
    </span>
  );
}

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function UploadSkillPage() {
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride } = useNavOverride();
  const { isMobile } = useResponsive();
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [github, setGithub] = useState("");
  const [category, setCategory] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState("");
  const [submissions, setSubmissions] = useState<SkillSubmission[] | null>(null);
  const [canReview, setCanReview] = useState(false);
  const folderInput = useRef<HTMLInputElement | null>(null);
  const zipInput = useRef<HTMLInputElement>(null);

  const loadSubmissions = useCallback(() => {
    bxApi("/skills/submissions").then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d) return;
      setSubmissions((d.submissions || []).map(normalizeSubmission));
      setCanReview(!!d.can_review);
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    bxApi("/me").then(r => r.json()).then(d => {
      const u = normalizeUser(d.user);
      setUser(u);
      if (u) loadSubmissions();
    }).catch(() => {}).finally(() => setUserLoaded(true));
  }, [loadSubmissions]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (userLoaded && !user) openLoginDialog(load);
  }, [userLoaded, user, openLoginDialog, load]);
  useEffect(() => {
    setNavOverride({ title: "Upload a skill", backHref: "/skills" });
    return () => clearNavOverride();
  }, [setNavOverride, clearNavOverride]);

  const take = async (next: Choice | string) => {
    setUploaded("");
    if (typeof next === "string") { setError(next); setChoice(null); return; }
    setError("");
    setChoice(next);
    setGithub("");
    if (next.kind === "folder") {
      setListingTitle(titleFrom(next.name));
      setTagline(taglineFrom(next.description));
    }
  };

  const takeZip = (file: File) =>
    take(file.size > MAX_BYTES ? `Skills can be up to 4 MB. This file is ${formatBytes(file.size)}.` : { kind: "zip", file });

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.items).map(i => i.webkitGetAsEntry()).filter(Boolean) as FileSystemEntry[];
    if (items.length === 1 && items[0].isFile && /\.zip$/i.test(items[0].name)) {
      const file = e.dataTransfer.files[0];
      if (file) takeZip(file);
      return;
    }
    // A dropped folder, or loose files from inside one.
    const picked = (await Promise.all(items.map(entry => walk(entry, "")))).flat();
    take(await readFolder(picked));
  };

  const upload = async () => {
    if (uploading) return;
    if (!category) { setError("Pick a category."); return; }
    setError("");
    setUploading(true);
    try {
      const source = choice?.kind === "folder"
        ? { files: await Promise.all(choice.files.map(async f => ({ path: f.path, content_base64: await toBase64(f.file) }))) }
        : choice?.kind === "zip"
          ? { zip_base64: await toBase64(choice.file) }
          : { github_url: github.trim() };
      const res = await bxApi("/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...source, category, title: listingTitle.trim() || null, tagline: tagline.trim() || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.message || "That upload didn't go through. Try again."); return; }
      const s = normalizeSubmission(d.submission || {});
      setUploaded(s.title || s.name || "Your skill");
      setChoice(null);
      setGithub("");
      setCategory("");
      setListingTitle("");
      setTagline("");
      loadSubmissions();
    } catch {
      setError("That upload didn't go through. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const ready = !!choice || /^https:\/\/github\.com\/\S+/.test(github.trim());

  if (!userLoaded) return null;

  return (
    <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px", fontFamily: "var(--sans)" }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: isMobile ? T.heading : T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
          Upload a skill
        </h1>
        <p style={{ fontSize: T.body, color: C.textSec, maxWidth: 600 }}>
          Share a skill you built. GrowthX checks it, then it&apos;s listed under your name and anyone can add it to
          Claude, ChatGPT, Claude Code or Codex.
        </p>
      </div>

      {!user ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px 32px" }}>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, marginBottom: 16 }}>Sign in to upload a skill.</p>
          <button onClick={() => openLoginDialog(load)} style={{
            padding: "10px 24px", borderRadius: 10, border: "none", background: C.accent, color: C.accentFg,
            fontSize: T.body, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
          }}>
            Sign in
          </button>
        </div>
      ) : (
        <>
          <div className="fade-up stagger-1" style={{ ...cardStyle, padding: isMobile ? "20px" : cardStyle.padding, maxWidth: 680 }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `1.5px dashed ${dragging ? C.text : C.border}`, borderRadius: 12, padding: isMobile ? "24px 16px" : "32px 24px",
                background: dragging ? C.surfaceWarm : C.bg, textAlign: "center", transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ fontSize: T.body, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                Drop your skill folder or a .zip here
              </div>
              <p style={{ ...meta2, marginBottom: 16 }}>
                It needs a SKILL.md with a name and a description at the top. Up to 4 MB.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" style={outlined} onClick={() => folderInput.current?.click()}>Choose folder</button>
                <button type="button" style={outlined} onClick={() => zipInput.current?.click()}>Choose .zip</button>
              </div>
              <input
                ref={el => { folderInput.current = el; el?.setAttribute("webkitdirectory", ""); }}
                type="file" multiple hidden
                onChange={async e => {
                  const files = Array.from(e.target.files || []).map(file => ({ path: file.webkitRelativePath || file.name, file }));
                  e.target.value = "";
                  if (files.length) take(await readFolder(files));
                }}
              />
              <input
                ref={zipInput} type="file" accept=".zip,application/zip" hidden
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) takeZip(f); }}
              />
            </div>

            {choice && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.borderLight}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {choice.kind === "folder" ? (
                    <>
                      <div style={{ fontSize: T.body, fontWeight: 600, color: C.text, marginBottom: 2 }}>{choice.name}</div>
                      <p style={{ ...body, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{choice.description}</p>
                      <p style={meta2}>{choice.files.length} file{choice.files.length === 1 ? "" : "s"} · {formatBytes(choice.size)}</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: T.body, fontWeight: 600, color: C.text, marginBottom: 2, overflowWrap: "anywhere" }}>{choice.file.name}</div>
                      <p style={meta2}>{formatBytes(choice.file.size)} · the name and description come from its SKILL.md</p>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setChoice(null)} style={{ ...outlined, padding: "4px 10px", fontSize: T.label }}>Remove</button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.borderLight }} />
              <span style={meta2}>or</span>
              <div style={{ flex: 1, height: 1, background: C.borderLight }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="skill-github">Paste a GitHub link to the skill&apos;s folder</label>
              <input
                id="skill-github"
                type="url"
                value={github}
                onChange={e => { setGithub(e.target.value); if (e.target.value) setChoice(null); setUploaded(""); }}
                placeholder="https://github.com/you/repo/tree/main/my-skill"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="skill-title">Title</label>
              <input
                id="skill-title" value={listingTitle} maxLength={80}
                onChange={e => setListingTitle(e.target.value)}
                placeholder="Leave empty to use your SKILL.md"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="skill-tagline">One line on what it does</label>
              <input
                id="skill-tagline" value={tagline} maxLength={200}
                onChange={e => setTagline(e.target.value)}
                placeholder="Leave empty to use your SKILL.md"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={label} htmlFor="skill-category">Category</label>
              <select id="skill-category" value={category} onChange={e => setCategory(e.target.value)} style={{ ...input, cursor: "pointer", color: category ? C.text : C.textMute }}>
                <option value="" disabled>Pick one</option>
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: C.errorSoft, border: `1px solid ${C.errorBorder}`, color: C.errorText, fontSize: T.bodySm }}>
                {error}
              </div>
            )}
            {uploaded && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: C.greenSoft, color: C.green, fontSize: T.bodySm }}>
                {uploaded} is uploaded. GrowthX checks it next; you&apos;ll see it under Your uploads.
              </div>
            )}

            <button
              type="button"
              onClick={upload}
              disabled={!ready || uploading}
              style={{
                width: "100%", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: T.body, fontWeight: 600,
                color: C.accentFg, background: C.accent, cursor: ready && !uploading ? "pointer" : "default",
                fontFamily: "var(--sans)", opacity: ready && !uploading ? 1 : 0.5,
              }}
            >
              {uploading ? "Uploading…" : "Upload skill"}
            </button>
          </div>

          {/* The member's own uploads */}
          {submissions && submissions.length > 0 && (
            <section className="fade-up stagger-2" style={{ marginTop: 44, maxWidth: 680 }}>
              <h2 style={{ fontSize: T.title, fontWeight: 400, fontFamily: "var(--serif)", color: C.text, marginBottom: 14 }}>Your uploads</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {submissions.map(s => (
                  <div key={s.id} style={{ ...cardStyle, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: T.body, fontWeight: 600, color: C.text }}>{s.title || s.name}</div>
                        <p style={{ ...body, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.tagline || s.description}</p>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                    <p style={{ ...meta2, marginTop: 8 }}>
                      Uploaded {date(s.createdAt)}{s.category ? ` · ${s.category}` : ""} · {s.files.length} file{s.files.length === 1 ? "" : "s"}
                      {s.status === "approved" && s.projectSlug && (
                        <> · <Link to={`/projects/${s.projectSlug}`} style={{ color: C.text, textDecoration: "underline", textUnderlineOffset: 2 }}>See it live</Link></>
                      )}
                    </p>
                    {s.status === "sent_back" && s.reviewNote && (
                      <p style={{ ...body, color: C.text, marginTop: 10, padding: "10px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                        <strong style={{ fontWeight: 600 }}>GrowthX&apos;s note:</strong> {s.reviewNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {canReview && (
            <p style={{ ...body, marginTop: 28 }}>
              You&apos;re on the GrowthX team: <Link to="/skills/review" style={{ color: C.text, textDecoration: "underline", textUnderlineOffset: 2 }}>review uploads waiting for a check</Link>.
            </p>
          )}
        </>
      )}
    </main>
  );
}
