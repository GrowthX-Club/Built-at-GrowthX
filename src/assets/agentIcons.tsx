// ── Agent Icon Repository ──
// 50 hand-drawn icons in Anthropic's illustration style
// Each icon: 1 filled silhouette + 1 gestural stroke + 1 maker's mark dot

import React from "react";

// ── Palettes ──
export const PALETTES = [
  { bg: "#FDF0E8", stroke: "#C15F3C", fill: "#C15F3C18", accent: "#D97757" },
  { bg: "#F0F4EC", stroke: "#788C5D", fill: "#788C5D18", accent: "#96A87A" },
  { bg: "#EEF2F7", stroke: "#6A9BCC", fill: "#6A9BCC18", accent: "#8DB4D6" },
  { bg: "#FFF5E8", stroke: "#B8862E", fill: "#B8862E18", accent: "#D4A84A" },
  { bg: "#F5EDEB", stroke: "#9A6B5A", fill: "#9A6B5A18", accent: "#B8917E" },
  { bg: "#F2F0EB", stroke: "#7A7268", fill: "#7A726818", accent: "#9A9288" },
  { bg: "#FDF0E8", stroke: "#D97757", fill: "#D9775718", accent: "#E8956E" },
  { bg: "#F0EDE8", stroke: "#8A7A5F", fill: "#8A7A5F18", accent: "#A89A7A" },
  { bg: "#EDF0EB", stroke: "#5A6B4A", fill: "#5A6B4A18", accent: "#7A8A6A" },
  { bg: "#F3EFEB", stroke: "#8A6A5A", fill: "#8A6A5A18", accent: "#AA8A7A" },
  { bg: "#ECEEF2", stroke: "#5A6070", fill: "#5A607018", accent: "#7A8090" },
  { bg: "#F5F0EB", stroke: "#7A6850", fill: "#7A685018", accent: "#9A8870" },
] as const;

export type Palette = (typeof PALETTES)[number];

// ── Drawing primitives ──

export const hashStr = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getPalette = (name: string, index: number): Palette => {
  const h = hashStr(name + String(index * 7 + 3));
  return PALETTES[h % PALETTES.length];
};

const wobble = (seed: number, amplitude = 1.5): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * amplitude * 2 - amplitude;
};

const sketchLine = (x1: number, y1: number, x2: number, y2: number, seed = 0): string => {
  const mx = (x1 + x2) / 2 + wobble(seed, 2);
  const my = (y1 + y2) / 2 + wobble(seed + 1, 2);
  return `M ${x1 + wobble(seed + 2, 0.8)} ${y1 + wobble(seed + 3, 0.8)} Q ${mx} ${my} ${x2 + wobble(seed + 4, 0.8)} ${y2 + wobble(seed + 5, 0.8)}`;
};

const sketchCircle = (cx: number, cy: number, r: number, seed = 0, segments = 10): string => {
  const pts: number[][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wr = r + wobble(seed + i * 3, r * 0.09);
    pts.push([cx + Math.cos(a) * wr + wobble(seed + i, 0.7), cy + Math.sin(a) * wr + wobble(seed + i + 10, 0.7)]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    d += ` Q ${(prev[0] + curr[0]) / 2 + wobble(seed + i * 7, 1)} ${(prev[1] + curr[1]) / 2 + wobble(seed + i * 7 + 1, 1)} ${curr[0]} ${curr[1]}`;
  }
  return d + " Z";
};

const sketchRect = (x: number, y: number, w: number, h: number, seed = 0): string => {
  const tl = [x + wobble(seed, 1), y + wobble(seed + 1, 1)];
  const tr = [x + w + wobble(seed + 2, 1), y + wobble(seed + 3, 1)];
  const br = [x + w + wobble(seed + 4, 1), y + h + wobble(seed + 5, 1)];
  const bl = [x + wobble(seed + 6, 1), y + h + wobble(seed + 7, 1)];
  return `M ${tl[0]} ${tl[1]} L ${tr[0]} ${tr[1]} L ${br[0]} ${br[1]} L ${bl[0]} ${bl[1]} Z`;
};

// ── Category type ──

export interface AgentCategory {
  id: string;
  label: string;
  desc: string;
  keywords: string[];
  render: (s: number, p: Palette, seed: number) => React.ReactElement;
}

// ── 50 Agent Categories ──

export const AGENT_CATEGORIES: AgentCategory[] = [
  // ── General Purpose ──
  {
    id: "research", label: "Research Agent", desc: "Web scraping, synthesis, competitive intel",
    keywords: ["research", "scrape", "synthesis", "intel", "analyze", "study", "survey", "investigate"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.42, s*0.42, s*0.22, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.58, s*0.58, s*0.78, s*0.78, seed+10)} strokeWidth={sw*1.4} />
        <path d={sketchLine(s*0.32, s*0.38, s*0.52, s*0.38, seed+20)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.68+wobble(seed+30,1)} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "coding", label: "Coding Agent", desc: "Code gen, debugging, PR review, refactoring",
    keywords: ["code", "dev", "engineer", "debug", "review", "refactor", "api", "github", "sdk", "cli", "devtool", "programming", "script", "terminal"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.32} ${s*0.3} L ${s*0.18+wobble(seed,1)} ${s*0.5} L ${s*0.32} ${s*0.7}`} />
        <path d={`M ${s*0.68} ${s*0.3} L ${s*0.82+wobble(seed+5,1)} ${s*0.5} L ${s*0.68} ${s*0.7}`} />
        <path d={sketchLine(s*0.55, s*0.24, s*0.45, s*0.76, seed+10)} stroke={p.accent} strokeWidth={sw*0.7} />
        <circle cx={s*0.22} cy={s*0.35} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "writing", label: "Writing Agent", desc: "Drafts, editing, blog posts, repurposing",
    keywords: ["write", "draft", "edit", "blog", "content", "copy", "article", "publish", "cms", "doc", "note"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.24, s*0.18, s*0.52, s*0.64, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.34, s*0.38, s*0.62, s*0.38, seed+10)} strokeWidth={sw*0.6} stroke={p.accent} />
        <path d={sketchLine(s*0.34, s*0.48, s*0.56, s*0.48, seed+20)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.66} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "data-analysis", label: "Data Analysis Agent", desc: "CSV/DB insights, visualization, reports",
    keywords: ["data", "analytics", "dashboard", "chart", "insight", "metric", "report", "kpi", "bi", "warehouse", "visualization"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.28, s*0.52, s*0.12, s*0.26, seed)} fill={p.fill} />
        <path d={sketchRect(s*0.44, s*0.36, s*0.12, s*0.42, seed+10)} fill={p.accent+"30"} />
        <path d={sketchRect(s*0.60, s*0.24, s*0.12, s*0.54, seed+20)} fill={p.fill} />
        <circle cx={s*0.36} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "personal-assistant", label: "Personal Assistant", desc: "Email triage, calendar, daily briefings",
    keywords: ["assistant", "calendar", "schedule", "reminder", "brief", "organize", "manage", "planner"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.48, s*0.28, seed)} fill={p.fill} />
        <path d={`M ${s*0.5} ${s*0.48} L ${s*0.5} ${s*0.34} L ${s*0.62+wobble(seed+10,1)} ${s*0.42}`} strokeWidth={sw*0.8} />
        <circle cx={s*0.5} cy={s*0.48} r={s*0.03} fill={p.stroke} stroke="none" />
        <circle cx={s*0.72} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "workflow", label: "Workflow Automation", desc: "Multi-step chains, tool orchestration",
    keywords: ["workflow", "automate", "automation", "chain", "orchestrat", "pipeline", "zapier", "trigger", "no-code"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.28, s*0.5, s*0.1, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.72, s*0.5, s*0.1, seed+10)} fill={p.fill} />
        <path d={sketchLine(s*0.38, s*0.5, s*0.62, s*0.5, seed+20)} strokeWidth={sw*0.7} />
        <path d={`M ${s*0.56} ${s*0.44} L ${s*0.62} ${s*0.5} L ${s*0.56} ${s*0.56}`} strokeWidth={sw*0.7} />
        <circle cx={s*0.5} cy={s*0.32} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "voice", label: "Voice Agent", desc: "Phone calls, IVR, transcription, voice UI",
    keywords: ["voice", "phone", "call", "transcri", "speech", "ivr", "audio", "speak", "listen"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.42, s*0.24, s*0.16, s*0.36, seed)} fill={p.fill} />
        <path d={`M ${s*0.42} ${s*0.68} Q ${s*0.42} ${s*0.78} ${s*0.5} ${s*0.78} Q ${s*0.58} ${s*0.78} ${s*0.58} ${s*0.68}`} />
        <path d={sketchLine(s*0.5, s*0.78, s*0.5, s*0.84, seed+10)} strokeWidth={sw*0.7} />
        <circle cx={s*0.68} cy={s*0.32} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "chat", label: "Chat Agent", desc: "Conversational interfaces, chatbots, Q&A",
    keywords: ["chat", "chatbot", "convers", "qa", "question", "answer", "dialog", "bot", "prompt"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.22} ${s*0.26} L ${s*0.78} ${s*0.26} L ${s*0.78} ${s*0.62} L ${s*0.42} ${s*0.62} L ${s*0.28+wobble(seed,1)} ${s*0.76} L ${s*0.34} ${s*0.62} L ${s*0.22} ${s*0.62} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.34, s*0.42, s*0.66, s*0.42, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={sketchLine(s*0.34, s*0.52, s*0.54, s*0.52, seed+20)} strokeWidth={sw*0.5} stroke={p.accent} />
        <circle cx={s*0.7} cy={s*0.34} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "summarization", label: "Summarization Agent", desc: "Meeting notes, article digests, TLDRs",
    keywords: ["summar", "digest", "tldr", "meeting note", "brief", "condensed", "recap"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.24, s*0.2, s*0.52, s*0.6, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.34, s*0.4, s*0.66, s*0.4, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={`M ${s*0.34} ${s*0.5} L ${s*0.5} ${s*0.5}`} strokeWidth={sw*0.5} stroke={p.accent} strokeLinecap="round" />
        <path d={sketchLine(s*0.44, s*0.58, s*0.56, s*0.52, seed+20)} strokeWidth={sw*1.2} stroke={p.stroke} />
        <circle cx={s*0.68} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "translation", label: "Translation Agent", desc: "Multilingual, localization, real-time",
    keywords: ["translat", "multilingual", "localiz", "i18n", "language", "interpret"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.38, s*0.44, s*0.2, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.6, s*0.52, s*0.18, seed+15)} fill={p.accent+"20"} />
        <path d={sketchLine(s*0.42, s*0.46, s*0.58, s*0.46, seed+30)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.28} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Sales & Marketing ──
  {
    id: "sales-outreach", label: "Sales Outreach", desc: "Cold emails, lead gen, follow-up sequences",
    keywords: ["sales", "outreach", "cold email", "lead gen", "follow-up", "prospect", "pipeline"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.2, s*0.32, s*0.6, s*0.38, seed)} fill={p.fill} />
        <path d={`M ${s*0.2+wobble(seed,1)} ${s*0.32} L ${s*0.5} ${s*0.54+wobble(seed+5,1)} L ${s*0.8} ${s*0.32}`} />
        <path d={`M ${s*0.62} ${s*0.28} L ${s*0.76} ${s*0.22}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <circle cx={s*0.78} cy={s*0.22} r={s*0.025} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "lead-scoring", label: "Lead Scoring", desc: "Qualify prospects, CRM enrichment",
    keywords: ["lead scor", "qualify", "crm", "enrichment", "prospect", "scoring"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.3} ${s*0.22} L ${s*0.7} ${s*0.22} L ${s*0.6} ${s*0.52} L ${s*0.6} ${s*0.78} L ${s*0.4} ${s*0.78} L ${s*0.4} ${s*0.52} Z`} fill={p.fill} />
        <path d={`M ${s*0.46} ${s*0.42} L ${s*0.5} ${s*0.34} L ${s*0.54} ${s*0.42}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <circle cx={s*0.66} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "seo", label: "SEO Agent", desc: "Keyword research, content optimization, audits",
    keywords: ["seo", "keyword", "rank", "search engine", "backlink", "crawl", "serp", "organic"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.46, s*0.44, s*0.24, seed)} fill={p.fill} />
        <path d={`M ${s*0.34} ${s*0.54} Q ${s*0.46} ${s*0.38} ${s*0.58} ${s*0.34}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <path d={`M ${s*0.54} ${s*0.38} L ${s*0.62} ${s*0.3}`} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.66} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "social-media", label: "Social Media", desc: "Scheduling, replies, trend monitoring",
    keywords: ["social media", "twitter", "linkedin", "instagram", "tiktok", "post", "schedule", "trend", "viral"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.36, s*0.36, s*0.08, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.64, s*0.36, s*0.08, seed+10)} fill={p.accent+"30"} />
        <path d={sketchCircle(s*0.5, s*0.62, s*0.08, seed+20)} fill={p.fill} />
        <path d={sketchLine(s*0.42, s*0.4, s*0.56, s*0.56, seed+30)} strokeWidth={sw*0.5} />
        <path d={sketchLine(s*0.58, s*0.4, s*0.54, s*0.56, seed+40)} strokeWidth={sw*0.5} />
        <circle cx={s*0.74} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "ad-optimization", label: "Ad Optimization", desc: "Campaign management, bid optimization",
    keywords: ["ad", "campaign", "bid", "ppc", "cpc", "advertis", "impression", "ctr"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.48, s*0.28, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.5, s*0.48, s*0.16, seed+10)} />
        <circle cx={s*0.5+wobble(seed+20,1)} cy={s*0.48+wobble(seed+21,1)} r={s*0.04} fill={p.accent} stroke="none" />
        <circle cx={s*0.72} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "competitive-intel", label: "Competitive Intel", desc: "Pricing changes, feature tracking, alerts",
    keywords: ["competitive", "competitor", "pricing", "feature track", "benchmark", "market intel"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.42, s*0.46, s*0.18, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.58, s*0.46, s*0.18, seed+15)} fill={p.fill} />
        <circle cx={s*0.42+wobble(seed+30,0.5)} cy={s*0.44} r={s*0.035} fill={p.stroke} stroke="none" />
        <circle cx={s*0.58+wobble(seed+35,0.5)} cy={s*0.44} r={s*0.035} fill={p.stroke} stroke="none" />
        <circle cx={s*0.5} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Customer-Facing ──
  {
    id: "customer-support", label: "Customer Support", desc: "Ticket triage, auto-responses, escalation",
    keywords: ["support", "ticket", "helpdesk", "zendesk", "intercom", "customer service", "escalat", "resolve"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.5} ${s*0.76} Q ${s*0.2} ${s*0.56} ${s*0.22} ${s*0.4} Q ${s*0.24} ${s*0.22} ${s*0.5} ${s*0.22} Q ${s*0.76} ${s*0.22} ${s*0.78} ${s*0.4} Q ${s*0.8} ${s*0.56} ${s*0.5} ${s*0.76} Z`} fill={p.fill} />
        <path d={`M ${s*0.38} ${s*0.44} L ${s*0.46} ${s*0.52+wobble(seed,1)} L ${s*0.62} ${s*0.38}`} strokeWidth={sw*0.8} stroke={p.accent} />
        <circle cx={s*0.32} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "onboarding", label: "Onboarding Agent", desc: "User activation, guided setup, tooltips",
    keywords: ["onboard", "activation", "setup", "tooltip", "guided", "walkthrough", "tour"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.26} ${s*0.72} L ${s*0.26} ${s*0.24} L ${s*0.46+wobble(seed,1)} ${s*0.24}`} fill={p.fill} strokeWidth={sw*1.2} />
        <path d={sketchLine(s*0.36, s*0.48, s*0.64, s*0.48, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={`M ${s*0.58} ${s*0.42} L ${s*0.64} ${s*0.48} L ${s*0.58} ${s*0.54}`} strokeWidth={sw*0.5} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.32} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "feedback", label: "Feedback Agent", desc: "Survey collection, NPS analysis, sentiment",
    keywords: ["feedback", "survey", "nps", "sentiment", "rating", "star", "satisfaction", "review"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.5} ${s*0.2} L ${s*0.56} ${s*0.38} L ${s*0.76} ${s*0.4} L ${s*0.62} ${s*0.54} L ${s*0.66} ${s*0.74} L ${s*0.5} ${s*0.62} L ${s*0.34} ${s*0.74} L ${s*0.38} ${s*0.54} L ${s*0.24} ${s*0.4} L ${s*0.44} ${s*0.38} Z`} fill={p.fill} />
        <circle cx={s*0.5} cy={s*0.46} r={s*0.04} fill={p.accent} stroke="none" opacity={0.5} />
        <circle cx={s*0.72} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "community", label: "Community Agent", desc: "Moderation, engagement, member matching",
    keywords: ["community", "moderat", "engage", "member", "forum", "discord", "slack community"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.38, s*0.38, s*0.1, seed)} fill={p.fill} />
        <path d={sketchCircle(s*0.62, s*0.38, s*0.1, seed+10)} fill={p.fill} />
        <path d={sketchCircle(s*0.5, s*0.58, s*0.1, seed+20)} fill={p.accent+"30"} />
        <circle cx={s*0.5} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Developer & Infra ──
  {
    id: "rag-knowledge", label: "RAG / Knowledge", desc: "Document Q&A, semantic search, embeddings",
    keywords: ["rag", "knowledge", "embedding", "semantic search", "vector", "document qa", "retriev"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.3} ${s*0.22} Q ${s*0.28} ${s*0.5} ${s*0.3} ${s*0.78} L ${s*0.7} ${s*0.78} Q ${s*0.72} ${s*0.5} ${s*0.7} ${s*0.22} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.38, s*0.44, s*0.62, s*0.44, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={sketchLine(s*0.38, s*0.56, s*0.56, s*0.56, seed+20)} strokeWidth={sw*0.5} stroke={p.accent} />
        <circle cx={s*0.64} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "multi-agent", label: "Multi-Agent", desc: "Orchestration, delegation, agent swarms",
    keywords: ["multi-agent", "swarm", "delegation", "orchestrat", "agent system", "coordinator"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.42, s*0.12, seed)} fill={p.accent+"30"} />
        <path d={sketchCircle(s*0.3, s*0.64, s*0.08, seed+10)} fill={p.fill} />
        <path d={sketchCircle(s*0.7, s*0.64, s*0.08, seed+20)} fill={p.fill} />
        <path d={sketchLine(s*0.44, s*0.5, s*0.34, s*0.58, seed+30)} strokeWidth={sw*0.5} />
        <path d={sketchLine(s*0.56, s*0.5, s*0.66, s*0.58, seed+40)} strokeWidth={sw*0.5} />
        <circle cx={s*0.5} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "tool-use-mcp", label: "Tool Use / MCP", desc: "API connectors, function calling, tool chains",
    keywords: ["tool use", "mcp", "function call", "connector", "plugin", "extension", "integration"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.56} ${s*0.22} L ${s*0.72} ${s*0.38} L ${s*0.56} ${s*0.54} L ${s*0.56} ${s*0.42} L ${s*0.34} ${s*0.42} L ${s*0.34} ${s*0.62} L ${s*0.56} ${s*0.62} L ${s*0.56} ${s*0.5} L ${s*0.72} ${s*0.66} L ${s*0.56} ${s*0.82}`} fill="none" strokeWidth={sw*0.8} />
        <circle cx={s*0.28} cy={s*0.52} r={s*0.04} fill={p.fill} stroke={p.stroke} strokeWidth={sw*0.6} />
        <circle cx={s*0.68} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "eval-testing", label: "Eval / Testing", desc: "Benchmarks, guardrails, output validation",
    keywords: ["eval", "test", "benchmark", "guardrail", "validat", "qa", "ci", "coverage", "assert"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.26, s*0.22, s*0.48, s*0.56, seed)} fill={p.fill} />
        <path d={`M ${s*0.36} ${s*0.46} L ${s*0.44} ${s*0.54+wobble(seed+10,1)} L ${s*0.6} ${s*0.38}`} strokeWidth={sw*1.1} stroke={p.accent} />
        <circle cx={s*0.66} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "monitoring", label: "Monitoring Agent", desc: "Traces, cost tracking, latency, debugging",
    keywords: ["monitor", "trace", "cost track", "latency", "observ", "log", "alert", "uptime"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.5, s*0.28, seed)} fill={p.fill} />
        <path d={`M ${s*0.26} ${s*0.5} L ${s*0.38} ${s*0.5} L ${s*0.44} ${s*0.36} L ${s*0.52} ${s*0.62} L ${s*0.58} ${s*0.42} L ${s*0.64} ${s*0.5} L ${s*0.74} ${s*0.5}`} strokeWidth={sw*0.8} stroke={p.accent} fill="none" />
        <circle cx={s*0.68} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "devops", label: "DevOps Agent", desc: "Deployment, CI/CD, incident response",
    keywords: ["devops", "deploy", "ci/cd", "incident", "infra", "kubernetes", "docker", "terraform"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.26} ${s*0.48} Q ${s*0.5} ${s*0.22} ${s*0.74} ${s*0.48} Q ${s*0.5} ${s*0.34} ${s*0.26} ${s*0.48} Z`} fill={p.fill} />
        <path d={`M ${s*0.26} ${s*0.54} Q ${s*0.5} ${s*0.78} ${s*0.74} ${s*0.54} Q ${s*0.5} ${s*0.68} ${s*0.26} ${s*0.54} Z`} fill={p.accent+"20"} />
        <circle cx={s*0.36} cy={s*0.34} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "database", label: "Database Agent", desc: "Query generation, migration, schema design",
    keywords: ["database", "sql", "query", "migration", "schema", "postgres", "mongo", "redis", "db"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx={s*0.5} cy={s*0.32} rx={s*0.26} ry={s*0.1} fill={p.fill} stroke={p.stroke} strokeWidth={sw} />
        <path d={`M ${s*0.24} ${s*0.32} L ${s*0.24} ${s*0.66}`} />
        <path d={`M ${s*0.76} ${s*0.32} L ${s*0.76} ${s*0.66}`} />
        <ellipse cx={s*0.5} cy={s*0.66} rx={s*0.26} ry={s*0.1} fill="none" stroke={p.stroke} strokeWidth={sw} />
        <circle cx={s*0.66} cy={s*0.48} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "security", label: "Security Agent", desc: "Vulnerability scanning, audit, compliance",
    keywords: ["security", "vulnerab", "audit", "secure", "auth", "encrypt", "firewall", "password", "sso"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.5} ${s*0.18} L ${s*0.74} ${s*0.3} L ${s*0.74} ${s*0.56} Q ${s*0.72} ${s*0.78} ${s*0.5} ${s*0.84} Q ${s*0.28} ${s*0.78} ${s*0.26} ${s*0.56} L ${s*0.26} ${s*0.3} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.5, s*0.42, s*0.5, s*0.58, seed+10)} strokeWidth={sw*0.8} stroke={p.accent} />
        <circle cx={s*0.5} cy={s*0.62} r={s*0.025} fill={p.accent} stroke="none" />
        <circle cx={s*0.66} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Finance & Legal ──
  {
    id: "finance", label: "Finance Agent", desc: "Expense tracking, invoicing, reconciliation",
    keywords: ["finance", "expense", "invoice", "reconcil", "accounting", "billing", "payment", "fintech"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.48, s*0.26, seed)} fill={p.fill} />
        <path d={`M ${s*0.5} ${s*0.32} L ${s*0.5} ${s*0.64}`} strokeWidth={sw*0.8} />
        <path d={`M ${s*0.44} ${s*0.38} Q ${s*0.56} ${s*0.34} ${s*0.56} ${s*0.44} Q ${s*0.56} ${s*0.5} ${s*0.44} ${s*0.52} Q ${s*0.56} ${s*0.54} ${s*0.56} ${s*0.58}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "tax", label: "Tax Agent", desc: "GST/tax filing, deductions, compliance",
    keywords: ["tax", "gst", "filing", "deduction", "return", "irs"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.26, s*0.2, s*0.48, s*0.62, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.36, s*0.36, s*0.64, s*0.36, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={sketchLine(s*0.36, s*0.5, s*0.52, s*0.5, seed+20)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={`M ${s*0.52} ${s*0.58} L ${s*0.64} ${s*0.7}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <path d={`M ${s*0.64} ${s*0.58} L ${s*0.52} ${s*0.7}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "investment", label: "Investment Agent", desc: "Portfolio analysis, market signals, screeners",
    keywords: ["invest", "portfolio", "market", "stock", "fund", "trading", "equity", "wealth"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.2} ${s*0.72} L ${s*0.36} ${s*0.56} L ${s*0.5} ${s*0.62} L ${s*0.66} ${s*0.34} L ${s*0.8} ${s*0.28}`} strokeWidth={sw*1.1} fill="none" />
        <path d={`M ${s*0.72} ${s*0.26} L ${s*0.8} ${s*0.28} L ${s*0.76} ${s*0.36}`} strokeWidth={sw*0.8} />
        <path d={`M ${s*0.2} ${s*0.72} L ${s*0.36} ${s*0.56} L ${s*0.5} ${s*0.62} L ${s*0.66} ${s*0.34} L ${s*0.8} ${s*0.28} L ${s*0.8} ${s*0.72} Z`} fill={p.fill} stroke="none" />
        <circle cx={s*0.34} cy={s*0.38} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "legal", label: "Legal Agent", desc: "Contract review, clause extraction, redlining",
    keywords: ["legal", "contract", "clause", "redline", "nda", "tos", "terms", "agreement"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchLine(s*0.5, s*0.2, s*0.5, s*0.56, seed)} strokeWidth={sw*0.8} />
        <path d={`M ${s*0.26} ${s*0.56} L ${s*0.74} ${s*0.56}`} strokeWidth={sw*0.8} />
        <path d={sketchCircle(s*0.34, s*0.68, s*0.08, seed+10)} fill={p.fill} />
        <path d={sketchCircle(s*0.66, s*0.68, s*0.08, seed+20)} fill={p.accent+"30"} />
        <circle cx={s*0.5} cy={s*0.2} r={s*0.03} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "compliance", label: "Compliance Agent", desc: "Policy checks, regulation tracking, audits",
    keywords: ["compliance", "policy", "regulat", "gdpr", "hipaa", "sox", "audit"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.26, s*0.2, s*0.48, s*0.6, seed)} fill={p.fill} />
        <path d={`M ${s*0.36} ${s*0.38} L ${s*0.42} ${s*0.44} L ${s*0.52} ${s*0.34}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <path d={`M ${s*0.36} ${s*0.54} L ${s*0.42} ${s*0.6} L ${s*0.52} ${s*0.5}`} strokeWidth={sw*0.7} stroke={p.accent} />
        <circle cx={s*0.66} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Healthcare & Education ──
  {
    id: "healthcare", label: "Healthcare Agent", desc: "Symptom triage, records, appointment booking",
    keywords: ["health", "medical", "symptom", "patient", "clinic", "hospital", "doctor", "pharma"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.48, s*0.28, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.5, s*0.34, s*0.5, s*0.62, seed+10)} strokeWidth={sw*1.1} stroke={p.accent} />
        <path d={sketchLine(s*0.36, s*0.48, s*0.64, s*0.48, seed+20)} strokeWidth={sw*1.1} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "wellness", label: "Wellness Agent", desc: "Fitness plans, habit tracking, mental health",
    keywords: ["wellness", "fitness", "habit", "mental health", "meditation", "sleep", "nutrition"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchLine(s*0.5, s*0.78, s*0.5, s*0.42, seed)} strokeWidth={sw*1.1} />
        <path d={`M ${s*0.5} ${s*0.46} Q ${s*0.3} ${s*0.3} ${s*0.28} ${s*0.22}`} />
        <path d={`M ${s*0.5} ${s*0.46} Q ${s*0.32} ${s*0.38} ${s*0.28} ${s*0.22}`} fill={p.fill} stroke="none" />
        <path d={`M ${s*0.5} ${s*0.38} Q ${s*0.7} ${s*0.22} ${s*0.72} ${s*0.18}`} />
        <path d={`M ${s*0.5} ${s*0.38} Q ${s*0.68} ${s*0.28} ${s*0.72} ${s*0.18}`} fill={p.accent+"30"} stroke="none" />
        <circle cx={s*0.38} cy={s*0.7} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "tutoring", label: "Tutoring Agent", desc: "Personalized lessons, quiz gen, explanations",
    keywords: ["tutor", "lesson", "quiz", "explain", "teach", "learn", "student", "education"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.5} ${s*0.22} L ${s*0.32} ${s*0.38} L ${s*0.32} ${s*0.54} L ${s*0.5} ${s*0.66} L ${s*0.68} ${s*0.54} L ${s*0.68} ${s*0.38} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.2, s*0.38, s*0.8, s*0.38, seed+10)} strokeWidth={sw*0.7} />
        <path d={sketchLine(s*0.5, s*0.66, s*0.5, s*0.8, seed+20)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.36} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "curriculum", label: "Curriculum Agent", desc: "Course planning, content structuring, LMS",
    keywords: ["curriculum", "course", "lms", "syllabus", "module", "training"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.3, s*0.42, s*0.44, s*0.34, seed)} fill={p.fill} />
        <path d={sketchRect(s*0.26, s*0.34, s*0.44, s*0.34, seed+10)} fill={p.accent+"20"} />
        <path d={sketchRect(s*0.22, s*0.26, s*0.44, s*0.34, seed+20)} fill={p.fill} />
        <circle cx={s*0.68} cy={s*0.34} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Commerce & Ops ──
  {
    id: "ecommerce", label: "E-commerce Agent", desc: "Product recs, inventory, dynamic pricing",
    keywords: ["ecommerce", "shop", "store", "cart", "checkout", "inventory", "product", "marketplace"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.24} ${s*0.34} L ${s*0.32} ${s*0.22} L ${s*0.68} ${s*0.22} L ${s*0.76} ${s*0.34} L ${s*0.72} ${s*0.74} L ${s*0.28} ${s*0.74} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.24, s*0.34, s*0.76, s*0.34, seed+10)} />
        <path d={sketchLine(s*0.44, s*0.48, s*0.56, s*0.48, seed+20)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.38} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "logistics", label: "Logistics Agent", desc: "Shipping, route optimization, tracking",
    keywords: ["logistics", "shipping", "route", "delivery", "supply chain", "freight", "warehouse"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.18, s*0.38, s*0.42, s*0.3, seed)} fill={p.fill} />
        <path d={`M ${s*0.6} ${s*0.38} L ${s*0.76} ${s*0.38} L ${s*0.82} ${s*0.54} L ${s*0.82} ${s*0.68} L ${s*0.6} ${s*0.68} L ${s*0.6} ${s*0.38}`} fill={p.accent+"20"} />
        <path d={sketchCircle(s*0.34, s*0.72, s*0.06, seed+10)} fill={p.stroke} />
        <path d={sketchCircle(s*0.7, s*0.72, s*0.06, seed+20)} fill={p.stroke} />
        <circle cx={s*0.48} cy={s*0.32} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "procurement", label: "Procurement Agent", desc: "Vendor comparison, PO generation, approvals",
    keywords: ["procurement", "vendor", "purchase order", "rfp", "supplier", "sourcing"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.22, s*0.28, s*0.56, s*0.44, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.22, s*0.28, s*0.5, s*0.18, seed+10)} strokeWidth={sw*0.7} />
        <path d={sketchLine(s*0.78, s*0.28, s*0.5, s*0.18, seed+20)} strokeWidth={sw*0.7} />
        <path d={sketchLine(s*0.34, s*0.48, s*0.66, s*0.48, seed+30)} strokeWidth={sw*0.5} stroke={p.accent} />
        <circle cx={s*0.68} cy={s*0.36} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "hr", label: "HR Agent", desc: "Resume screening, candidate matching, onboarding",
    keywords: ["hr", "hire", "recruit", "resume", "candidate", "talent", "job", "interview", "employee"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.32, s*0.12, seed)} fill={p.fill} />
        <path d={`M ${s*0.3} ${s*0.78} Q ${s*0.3} ${s*0.54} ${s*0.5} ${s*0.5} Q ${s*0.7} ${s*0.54} ${s*0.7} ${s*0.78}`} fill={p.fill} />
        <path d={sketchRect(s*0.42, s*0.56, s*0.16, s*0.1, seed+10)} fill={p.accent+"30"} stroke="none" />
        <circle cx={s*0.66} cy={s*0.26} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Creative ──
  {
    id: "design", label: "Design Agent", desc: "UI generation, wireframes, asset creation",
    keywords: ["design", "ui", "ux", "wireframe", "figma", "mockup", "prototype", "graphic", "visual", "brand"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.62} ${s*0.2} L ${s*0.78} ${s*0.36} L ${s*0.36} ${s*0.78} L ${s*0.2} ${s*0.82} L ${s*0.24} ${s*0.66} Z`} fill={p.fill} />
        <path d={sketchLine(s*0.34, s*0.64, s*0.58, s*0.4, seed+10)} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.7} cy={s*0.28} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "image-gen", label: "Image Gen Agent", desc: "Prompt crafting, style transfer, batch gen",
    keywords: ["image gen", "dall-e", "midjourney", "stable diffusion", "image creat", "style transfer", "generat image"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.22, s*0.26, s*0.56, s*0.48, seed)} fill={p.fill} />
        <path d={`M ${s*0.22} ${s*0.62} Q ${s*0.38} ${s*0.5} ${s*0.5} ${s*0.56} Q ${s*0.62} ${s*0.62} ${s*0.78} ${s*0.48}`} strokeWidth={sw*0.6} stroke={p.accent} fill="none" />
        <circle cx={s*0.62} cy={s*0.38} r={s*0.04} fill={p.accent} stroke="none" opacity={0.4} />
        <circle cx={s*0.7} cy={s*0.3} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "video", label: "Video Agent", desc: "Editing, clipping, subtitle generation",
    keywords: ["video", "clip", "subtitle", "edit video", "render", "stream", "youtube", "reel"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.2, s*0.28, s*0.6, s*0.44, seed)} fill={p.fill} />
        <path d={`M ${s*0.44} ${s*0.42} L ${s*0.6} ${s*0.5} L ${s*0.44} ${s*0.58} Z`} fill={p.accent+"40"} stroke={p.accent} strokeWidth={sw*0.7} />
        <circle cx={s*0.72} cy={s*0.32} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "music-audio", label: "Music / Audio", desc: "Generation, mixing, podcast editing",
    keywords: ["music", "audio", "podcast", "mix", "sound", "beat", "song", "synth"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.34, s*0.62, s*0.1, seed)} fill={p.fill} />
        <path d={`M ${s*0.44} ${s*0.62} L ${s*0.44} ${s*0.24}`} strokeWidth={sw*0.8} />
        <path d={`M ${s*0.44} ${s*0.24} Q ${s*0.66} ${s*0.2} ${s*0.66} ${s*0.32} Q ${s*0.66} ${s*0.42} ${s*0.44} ${s*0.38}`} fill={p.accent+"30"} strokeWidth={sw*0.6} />
        <circle cx={s*0.62} cy={s*0.56} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  // ── Emerging ──
  {
    id: "browser", label: "Browser Agent", desc: "Web navigation, form filling, scraping",
    keywords: ["browser", "web navig", "form fill", "scrape", "crawl", "headless", "puppeteer", "playwright"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchCircle(s*0.5, s*0.48, s*0.28, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.5, s*0.2, s*0.5, s*0.76, seed+10)} strokeWidth={sw*0.5} />
        <path d={sketchLine(s*0.22, s*0.48, s*0.78, s*0.48, seed+20)} strokeWidth={sw*0.5} />
        <path d={`M ${s*0.3} ${s*0.3} Q ${s*0.5} ${s*0.4} ${s*0.7} ${s*0.3}`} strokeWidth={sw*0.5} stroke={p.accent} fill="none" />
        <circle cx={s*0.68} cy={s*0.66} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "document", label: "Document Agent", desc: "PDF processing, extraction, form filling",
    keywords: ["document", "pdf", "extract", "ocr", "form", "parse", "template"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.26} ${s*0.2} L ${s*0.58} ${s*0.2} L ${s*0.74} ${s*0.36} L ${s*0.74} ${s*0.8} L ${s*0.26} ${s*0.8} Z`} fill={p.fill} />
        <path d={`M ${s*0.58} ${s*0.2} L ${s*0.58} ${s*0.36} L ${s*0.74} ${s*0.36}`} />
        <path d={sketchLine(s*0.36, s*0.52, s*0.64, s*0.52, seed+10)} strokeWidth={sw*0.5} stroke={p.accent} />
        <path d={sketchLine(s*0.36, s*0.62, s*0.54, s*0.62, seed+20)} strokeWidth={sw*0.5} stroke={p.accent} />
        <circle cx={s*0.46} cy={s*0.42} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "email", label: "Email Agent", desc: "Inbox zero, smart replies, categorization",
    keywords: ["email", "inbox", "mail", "newsletter", "smtp", "reply", "gmail"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.2, s*0.3, s*0.6, s*0.4, seed)} fill={p.fill} />
        <path d={`M ${s*0.2+wobble(seed+10,0.8)} ${s*0.3} L ${s*0.5} ${s*0.54+wobble(seed+15,1)} L ${s*0.8} ${s*0.3}`} />
        <path d={`M ${s*0.62} ${s*0.24} L ${s*0.72} ${s*0.24} L ${s*0.72} ${s*0.34}`} strokeWidth={sw*0.6} stroke={p.accent} />
        <circle cx={s*0.72} cy={s*0.24} r={s*0.025} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "scheduling", label: "Scheduling Agent", desc: "Meeting booking, availability, reminders",
    keywords: ["schedul", "meeting", "book", "availab", "calendar", "appointment", "remind"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={sketchRect(s*0.22, s*0.28, s*0.56, s*0.52, seed)} fill={p.fill} />
        <path d={sketchLine(s*0.22, s*0.42, s*0.78, s*0.42, seed+10)} strokeWidth={sw*0.6} />
        <path d={sketchLine(s*0.36, s*0.2, s*0.36, s*0.34, seed+20)} strokeWidth={sw*0.8} />
        <path d={sketchLine(s*0.64, s*0.2, s*0.64, s*0.34, seed+30)} strokeWidth={sw*0.8} />
        <circle cx={s*0.42} cy={s*0.56} r={s*0.03} fill={p.accent} stroke="none" opacity={0.5} />
        <circle cx={s*0.7} cy={s*0.34} r={s*0.02} fill={p.accent} stroke="none" opacity={0.6} />
      </g>);
    }
  },
  {
    id: "notification", label: "Notification Agent", desc: "Smart alerts, digest generation, priority",
    keywords: ["notification", "alert", "push", "digest", "priority", "bell", "notify"],
    render: (s, p, seed) => {
      const sw = s * 0.045;
      return (<g fill="none" stroke={p.stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${s*0.3} ${s*0.58} Q ${s*0.3} ${s*0.28} ${s*0.5} ${s*0.24} Q ${s*0.7} ${s*0.28} ${s*0.7} ${s*0.58} L ${s*0.76} ${s*0.64} L ${s*0.24} ${s*0.64} Z`} fill={p.fill} />
        <path d={`M ${s*0.42} ${s*0.68} Q ${s*0.5} ${s*0.78} ${s*0.58} ${s*0.68}`} strokeWidth={sw*0.7} />
        <circle cx={s*0.64} cy={s*0.26} r={s*0.04} fill={p.accent} stroke="none" opacity={0.7} />
        <circle cx={s*0.36} cy={s*0.34} r={s*0.02} fill={p.accent} stroke="none" opacity={0.5} />
      </g>);
    }
  },
];

// ── Lookup helpers ──

const categoryMap = new Map(AGENT_CATEGORIES.map(c => [c.id, c]));

/** Get a category by ID */
export const getCategoryById = (id: string): AgentCategory | undefined => categoryMap.get(id);

/** Match text against category keywords, return best match or random fallback */
export const matchCategory = (text: string): AgentCategory => {
  const lower = text.toLowerCase();
  let best: AgentCategory | null = null;
  let bestScore = 0;
  for (const cat of AGENT_CATEGORIES) {
    let hits = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) hits++;
    }
    if (hits > bestScore) {
      bestScore = hits;
      best = cat;
    }
  }
  if (best) return best;
  // Fallback: deterministic pick from text hash
  return AGENT_CATEGORIES[hashStr(text || "x") % AGENT_CATEGORIES.length];
};

/** Randomly assign an icon — uses optional seed for determinism */
export const assignRandomIcon = (seed?: string): AgentCategory => {
  if (seed) {
    return AGENT_CATEGORIES[hashStr(seed) % AGENT_CATEGORIES.length];
  }
  return AGENT_CATEGORIES[Math.floor(Math.random() * AGENT_CATEGORIES.length)];
};

/** Get icon for a project — keyword match from name+tagline, with deterministic palette */
export const getIconForProject = (name: string, tagline = ""): { category: AgentCategory; palette: Palette; seed: number } => {
  const category = matchCategory(`${name} ${tagline}`);
  const idx = AGENT_CATEGORIES.indexOf(category);
  const palette = getPalette(category.id, idx);
  const seed = hashStr(category.id + name) % 1000;
  return { category, palette, seed };
};

// ── AgentIcon component ──

interface AgentIconProps {
  /** Category ID or full category object */
  category: string | AgentCategory;
  size?: number;
  /** Color variation seed */
  colorSeed?: number;
}

export default function AgentIcon({ category, size = 40, colorSeed = 0 }: AgentIconProps) {
  const cat = typeof category === "string" ? getCategoryById(category) : category;
  if (!cat) return null;
  const p = getPalette(cat.id, colorSeed);
  const seed = hashStr(cat.id + String(colorSeed)) % 1000;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: p.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: `1px solid ${p.stroke}18`,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {cat.render(size, p, seed)}
      </svg>
    </div>
  );
}
