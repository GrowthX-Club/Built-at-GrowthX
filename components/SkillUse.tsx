import { useState } from "react";
import { C, T, type ProjectSkill } from "@/types";

// The GrowthX connector's page on gx-community, where members add GrowthX to Claude (web, desktop, Claude Code).
const CONNECT_URL = "https://growthx.club/community/mcp";

// Card and label styles copied from ProjectDetailClient (Discussion composer card, creator card text).
const card = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px",
} as const;
const title = { fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", lineHeight: 1.3 } as const;
const body = { fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55 } as const;
const meta = { fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", lineHeight: 1.4 } as const;

function ConnectButton() {
  return (
    <a
      href={CONNECT_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        // Outlined, like Copy: GrowthX MCP is invite-only, so the install line stays the main way in.
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
        border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: T.bodySm, fontWeight: 600,
        fontFamily: "var(--sans)", textDecoration: "none", transition: "background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.surfaceWarm; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
    >
      Connect GrowthX {"→"}
    </a>
  );
}

/** The Skills page's side card: the install works for anyone; GrowthX MCP is invite-only (mcp_access flag) for now. */
export function ConnectCard() {
  return (
    <div style={card}>
      <div style={{ ...title, marginBottom: 8 }}>How to use them</div>
      <p style={{ ...body, marginBottom: 12 }}>Each skill's page has a one-line install for Claude Code or Codex.</p>
      <p style={{ ...body, marginBottom: 14 }}>
        In Claude, through GrowthX MCP, which is in an invite-only beta: if it's on for you, connect once and Claude uses
        these skills when a task fits.
      </p>
      <ConnectButton />
    </div>
  );
}

/**
 * The skill's GitHub folder pinned to the reviewed commit (https://github.com/owner/repo/tree/<40-char sha>[/path]),
 * or null for anything else. The skills CLI installs that exact commit from this URL.
 */
function pinnedGithubUrl(raw: string): string | null {
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

/** The project page's box for a reviewed skill: use it through GrowthX, or install it in a coding agent. */
export function SkillUseBox({ skill }: { skill: ProjectSkill }) {
  const [copied, setCopied] = useState(false);
  const source = pinnedGithubUrl(skill.sourceUrl);
  const command = source ? `npx skills add ${source}` : null;
  const reviewed = new Date(skill.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Same fallback as the API key copy in settings.tsx, for browsers without the async clipboard.
  const copy = async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const el = document.createElement("textarea");
      el.value = command;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ ...card, marginBottom: 28 }}>
      <div style={{ ...title, marginBottom: 16 }}>Use this skill</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {command && (
          <div>
            <div style={{ ...body, color: C.text, fontWeight: 600, marginBottom: 8 }}>In Claude Code or Codex</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 14px",
              borderRadius: 10, border: `1px solid ${C.borderLight}`, background: C.bg,
            }}>
              <code style={{
                // Wraps on phones instead of scrolling; Copy copies the exact command either way.
                flex: 1, minWidth: 0, overflowWrap: "anywhere",
                fontSize: T.label, color: C.text, fontFamily: "var(--mono)", lineHeight: 1.5,
              }}>
                {command}
              </code>
              <button
                onClick={copy}
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
            <p style={{ ...meta, marginTop: 8 }}>Installs the exact version GrowthX checked.</p>
          </div>
        )}

        <div>
          <div style={{ ...body, color: C.text, fontWeight: 600, marginBottom: 4 }}>In Claude, through GrowthX MCP</div>
          <p style={{ ...body, marginBottom: 12 }}>
            GrowthX MCP is in an invite-only beta. If it's on for you, connect once, then ask Claude for the task. It
            uses this skill and tells you it did.
          </p>
          <ConnectButton />
        </div>
      </div>

      <div style={{ ...meta, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.borderLight}` }}>
        Checked by GrowthX on {reviewed}
        {source && (
          <>
            {" \u00B7 "}
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
