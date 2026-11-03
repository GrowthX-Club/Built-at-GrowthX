import { useState, type ReactNode } from "react";
import { C, T, type ProjectSkill } from "@/types";
import { bxUrl } from "@/lib/api";
import { useResponsive } from "@/hooks/useMediaQuery";

// The GrowthX connector's page on gx-community, where members add GrowthX to Claude (web, desktop, Claude Code).
const CONNECT_URL = "https://growthx.club/community/mcp";

// Card and label styles copied from ProjectDetailClient (Discussion composer card, creator card text).
const card = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px",
} as const;
const title = { fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", lineHeight: 1.3 } as const;
const body = { fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55 } as const;
const meta = { fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", lineHeight: 1.4 } as const;
// Same weight and colour as the "In Claude Code or Codex" label in the box below.
const strong = { color: C.text, fontWeight: 600 } as const;
const link = { color: C.text, textDecoration: "underline", textUnderlineOffset: 2 } as const;

function ConnectButton() {
  return (
    <a
      href={CONNECT_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        // Outlined, like Copy: the downloads stay the main way in.
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
        border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 16, fontWeight: 600,
        fontFamily: "var(--sans)", textDecoration: "none", transition: "background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.surfaceWarm; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
    >
      Connect GrowthX MCP {"→"}
    </a>
  );
}

/** The Skills page's side card. */
export function ConnectCard() {
  return (
    <div style={card}>
      <div style={{ ...title, marginBottom: 8 }}>How to use them</div>
      <p style={{ ...body, marginBottom: 12 }}>
        <strong style={strong}>Add any of them</strong> to Claude, ChatGPT, Claude Code or Codex: open the skill and pick
        the app you use.
      </p>
      <p style={{ ...body, marginBottom: 14 }}>
        <strong style={strong}>Use all of them in Claude</strong> through GrowthX MCP, with nothing to install. Connect
        once, then ask Claude for the task and it uses the skill that fits.
      </p>
      <ConnectButton />
    </div>
  );
}

/**
 * The skill's GitHub folder pinned to the reviewed commit (https://github.com/owner/repo/tree/<40-char sha>[/path]),
 * or null for anything else. The skills CLI installs that exact commit from this URL.
 */
function pinnedGithubUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/\.?$/, "");
    if (url.protocol !== "https:" || url.hostname !== "github.com") return null;
    if (!/^\/[\w.-]+\/[\w.-]+\/tree\/[0-9a-f]{40}(\/[\w./-]+)?$/i.test(path)) return null;
    return `https://github.com${path}`;
  } catch {
    return null;
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} KB`;
  return `${Math.round(n / 104857.6) / 10} MB`;
}

// Same fallback as the API key copy in settings.tsx, for browsers without the async clipboard.
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

/** A command or prompt with a Copy button; wraps on phones instead of scrolling. */
function CopyBox({ text, mono = true }: { text: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 14px",
      borderRadius: 10, border: `1px solid ${C.borderLight}`, background: C.bg,
    }}>
      <code style={{
        flex: 1, minWidth: 0, overflowWrap: "anywhere",
        fontSize: T.label, color: C.text, fontFamily: mono ? "var(--mono)" : "var(--sans)", lineHeight: 1.5,
      }}>
        {text}
      </code>
      <button
        onClick={async () => { await copyText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{
          flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface, color: C.text, fontSize: T.label, fontWeight: 600,
          fontFamily: "var(--sans)", cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceWarm; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function DownloadButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      style={{
        // Outlined: the page's one filled button is Install at the top.
        display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 18px", borderRadius: 12,
        border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 16, fontWeight: 600,
        fontFamily: "var(--sans)", textDecoration: "none", transition: "border-color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
      Download skill
    </a>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol style={{ ...body, margin: "14px 0 0", paddingLeft: 20, listStyle: "decimal", display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div style={{ ...body, color: C.text, fontWeight: 600, marginBottom: 8 }}>{children}</div>
);

type Tab = "claude" | "chatgpt" | "code" | "mcp";

/** The project page's box for a checked skill: one tab per app it installs into. */
export function SkillUseBox({ skill, slug }: { skill: ProjectSkill; slug: string }) {
  const { isMobile } = useResponsive();
  const source = pinnedGithubUrl(skill.sourceUrl);
  const download = skill.hasBundle ? bxUrl(`/skills/${encodeURIComponent(slug)}/download`) : null;
  const tabs: { key: Tab; label: string }[] = [
    ...(download ? [{ key: "claude" as const, label: "Claude" }, { key: "chatgpt" as const, label: "ChatGPT" }] : []),
    ...(download || source ? [{ key: "code" as const, label: "Claude Code & Codex" }] : []),
    { key: "mcp", label: "GrowthX MCP" },
  ];
  const [tab, setTab] = useState<Tab>(tabs[0].key);
  const reviewed = new Date(skill.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div style={{ ...card, marginBottom: 28 }}>
      <div style={{ ...title, marginBottom: 12 }}>Use this skill</div>

      {/* Underlined tabs, as the Projects / Skills tabs in AppNav. On phones they scroll, with the same right-edge
          fade as the creators row in ProjectDetailClient. */}
      <div style={{ position: "relative", marginBottom: 18 }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", columnGap: isMobile ? 18 : 22, borderBottom: `1px solid ${C.borderLight}`,
        }}
      >
        {tabs.map(t => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                minHeight: 44, padding: "0", marginBottom: -1, background: "none", border: "none",
                borderBottom: `2px solid ${active ? C.text : "transparent"}`,
                color: active ? C.text : C.textSec, fontSize: 16, fontWeight: active ? 600 : 500,
                fontFamily: "var(--sans)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      </div>

      {tab === "claude" && download && (
        <div>
          <DownloadButton href={download} />
          <Steps items={[
            <>In <a href="https://claude.ai/customize/skills" target="_blank" rel="noopener noreferrer" style={link}>Claude</a>, open <strong style={strong}>Customize → Skills</strong>.</>,
            <>Choose <strong style={strong}>Add → Upload skill</strong>.</>,
            <>Pick the file you downloaded.</>,
          ]} />
        </div>
      )}

      {tab === "chatgpt" && download && (
        <div>
          <DownloadButton href={download} />
          <Steps items={[
            <>In <a href="https://chatgpt.com/skills" target="_blank" rel="noopener noreferrer" style={link}>ChatGPT</a>, open <strong style={strong}>Customize → Skills</strong>.</>,
            <>Choose <strong style={strong}>Add → Upload from your computer</strong>.</>,
            <>Pick the file you downloaded.</>,
          ]} />
        </div>
      )}

      {tab === "code" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {source && (
            <div>
              <Label>Run this in your terminal</Label>
              <CopyBox text={`npx skills add ${source}`} />
              <p style={{ ...meta, marginTop: 8 }}>Installs the exact version GrowthX checked.</p>
            </div>
          )}
          {download && (
            <div>
              <Label>{source ? "Or paste this into Claude Code or Codex" : "Paste this into Claude Code or Codex"}</Label>
              <CopyBox
                mono={false}
                text={`Install the agent skill from ${download}: download the zip and unzip it into my skills folder.`}
              />
            </div>
          )}
        </div>
      )}

      {tab === "mcp" && (
        <div>
          <p style={{ ...body, marginBottom: 12 }}>
            With GrowthX MCP connected, Claude can use this skill with nothing to install. Ask for the task, or name the
            skill.
          </p>
          <ConnectButton />
        </div>
      )}

      <div style={{ ...meta, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.borderLight}` }}>
        {skill.downloads >= 10 && <>{skill.downloads.toLocaleString("en-IN")} downloads · </>}
        Checked by GrowthX on {reviewed}
        {source && (
          <>
            {" · "}
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.textSec, textDecoration: "underline", textUnderlineOffset: 2 }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textSec; }}
            >
              Read it on GitHub
            </a>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * SKILL.md as readable text: headings and code fences get their own look, everything else keeps its line breaks.
 * Builds React nodes only, never raw HTML (the text is member-written), like RichTextDisplay.
 */
export function SkillMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/^---\n[\s\S]*?\n---\n?/, "").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.join("").trim()) {
      blocks.push(<p key={blocks.length} style={{ ...body, color: C.text, whiteSpace: "pre-wrap", margin: "0 0 12px" }}>{para.join("\n").trim()}</p>);
    }
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const size = heading[1].length <= 2 ? T.body : T.bodySm;
      blocks.push(<div key={blocks.length} style={{ fontSize: size, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", margin: "18px 0 8px", lineHeight: 1.3 }}>{heading[2]}</div>);
    } else if (/^```/.test(line)) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i]);
      blocks.push(
        <pre key={blocks.length} style={{
          margin: "0 0 12px", padding: "10px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}`,
          fontSize: T.label, fontFamily: "var(--mono)", color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
        }}>{code.join("\n")}</pre>
      );
    } else if (!line.trim()) {
      flush();
    } else {
      para.push(line);
    }
  }
  flush();
  return <>{blocks}</>;
}

/** The skill's files and full text, folded like skills.sh's SKILL.md section. */
export function SkillText({ skill }: { skill: ProjectSkill }) {
  const [open, setOpen] = useState(false);
  if (!skill.instructions) return null;
  // ponytail: length stands in for rendered height; fold only text that clearly runs past the fold.
  const folds = skill.instructions.length > 1500;
  return (
    <div style={{ ...card, marginBottom: 28 }}>
      <div style={{ ...title, marginBottom: 6 }}>Read the skill</div>
      {skill.files.length > 0 && (
        <p style={{ ...meta, marginBottom: 14 }}>
          {skill.files.map(f => `${f.path} (${formatBytes(f.size)})`).join(" · ")}
        </p>
      )}
      <div style={{ position: "relative", maxHeight: open || !folds ? "none" : 360, overflow: "hidden" }}>
        <SkillMarkdown text={skill.instructions} />
        {!open && folds && (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 96,
            background: `linear-gradient(to bottom, transparent, ${C.surface})`,
          }} />
        )}
      </div>
      {folds && <div style={{ textAlign: "center", marginTop: 8 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: T.label, fontWeight: 600, fontFamily: "var(--sans)", cursor: "pointer",
          }}
        >
          {open ? "Show less" : "Show more"}
        </button>
      </div>}
    </div>
  );
}
