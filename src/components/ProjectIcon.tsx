const ICON_PALETTES = [
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
];

const ICON_CONCEPTS: { keywords: string[]; concept: string }[] = [
  { keywords: ["ai", "ml", "intelligence", "gpt", "claude", "llm", "copilot", "model", "neural", "predict", "smart"], concept: "brain" },
  { keywords: ["data", "analytics", "metric", "dashboard", "chart", "insight", "track", "monitor", "funnel", "conversion"], concept: "chart" },
  { keywords: ["email", "mail", "inbox", "message", "cold", "outreach", "reply", "send", "newsletter"], concept: "envelope" },
  { keywords: ["code", "dev", "engineer", "api", "github", "stack", "debug", "review", "script", "terminal"], concept: "code" },
  { keywords: ["money", "price", "revenue", "pay", "billing", "tax", "finance", "gst", "cost", "quota", "sales"], concept: "coin" },
  { keywords: ["hire", "team", "people", "talent", "candidate", "skill", "hr", "recruit", "onboard"], concept: "person" },
  { keywords: ["launch", "ship", "deploy", "release", "waitlist", "product hunt", "go live"], concept: "rocket" },
  { keywords: ["secure", "auth", "privacy", "guard", "protect", "shield", "churn", "prevent", "safe"], concept: "shield" },
  { keywords: ["design", "ui", "ux", "interface", "wireframe", "figma", "layout", "visual", "brand", "portfolio"], concept: "pen" },
  { keywords: ["search", "find", "discover", "explore", "browse", "lookup", "scope", "market size"], concept: "compass" },
  { keywords: ["doc", "document", "write", "report", "note", "meeting", "summary", "brief", "spec", "content", "blog"], concept: "page" },
  { keywords: ["build", "create", "maker", "side project", "tool", "form", "craft", "construct"], concept: "blocks" },
  { keywords: ["fast", "speed", "performance", "real-time", "instant", "quick", "alert", "uptime"], concept: "lightning" },
  { keywords: ["connect", "network", "integrate", "sync", "link", "slack", "linear", "jira", "webhook"], concept: "nodes" },
  { keywords: ["grow", "growth", "scale", "trend", "roadmap", "plan", "strategy", "feature", "pitch"], concept: "sprout" },
  { keywords: ["image", "video", "record", "demo", "screen", "camera", "media", "photo", "reel"], concept: "frame" },
  { keywords: ["test", "experiment", "ab", "copy", "compare", "variant", "bug", "qa", "beta"], concept: "flask" },
  { keywords: ["support", "help", "customer", "ticket", "feedback", "review", "rating", "star"], concept: "heart" },
];

// ── Drawing primitives ──

const wobble = (seed: number, amplitude = 1.5) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * amplitude * 2 - amplitude;
};

const sketchLine = (x1: number, y1: number, x2: number, y2: number, seed = 0) => {
  const mx = (x1 + x2) / 2 + wobble(seed, 2);
  const my = (y1 + y2) / 2 + wobble(seed + 1, 2);
  return `M ${x1 + wobble(seed + 2, 0.8)} ${y1 + wobble(seed + 3, 0.8)} Q ${mx} ${my} ${x2 + wobble(seed + 4, 0.8)} ${y2 + wobble(seed + 5, 0.8)}`;
};

const sketchCircle = (cx: number, cy: number, r: number, seed = 0, segments = 8) => {
  const pts: number[][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wr = r + wobble(seed + i * 3, r * 0.08);
    pts.push([cx + Math.cos(a) * wr + wobble(seed + i, 0.6), cy + Math.sin(a) * wr + wobble(seed + i + 10, 0.6)]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const cpx = (prev[0] + curr[0]) / 2 + wobble(seed + i * 7, 1);
    const cpy = (prev[1] + curr[1]) / 2 + wobble(seed + i * 7 + 1, 1);
    d += ` Q ${cpx} ${cpy} ${curr[0]} ${curr[1]}`;
  }
  return d + " Z";
};

const sketchRect = (x: number, y: number, w: number, h: number, seed = 0) => {
  const tl = [x + wobble(seed, 1), y + wobble(seed + 1, 1)];
  const tr = [x + w + wobble(seed + 2, 1), y + wobble(seed + 3, 1)];
  const br = [x + w + wobble(seed + 4, 1), y + h + wobble(seed + 5, 1)];
  const bl = [x + wobble(seed + 6, 1), y + h + wobble(seed + 7, 1)];
  return `M ${tl[0]} ${tl[1]} L ${tr[0]} ${tr[1]} L ${br[0]} ${br[1]} L ${bl[0]} ${bl[1]} Z`;
};

const hashStr = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const matchConcept = (title: string, description: string) => {
  const text = `${title} ${description}`.toLowerCase();
  let bestMatch: string | null = null, bestScore = 0;
  for (const entry of ICON_CONCEPTS) {
    let score = 0;
    for (const kw of entry.keywords) if (text.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; bestMatch = entry.concept; }
  }
  return bestMatch || "blocks";
};

// ── Concept renderer ──

type Palette = typeof ICON_PALETTES[number];

const renderConcept = (concept: string, palette: Palette, s: number, seed: number) => {
  const r = s / 2;
  const sw = s * 0.045;
  const commonProps = {
    fill: "none" as const, stroke: palette.stroke, strokeWidth: sw,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };

  switch (concept) {
    case "brain":
      return (<g {...commonProps}><path d={sketchCircle(r, r * 0.85, s * 0.28, seed, 10)} fill={palette.fill} /><path d={sketchLine(r, r * 0.58, r, r * 1.15, seed + 20)} /><path d={sketchLine(r * 0.72, r * 0.7, r * 1.28, r * 0.7, seed + 30)} /><path d={`M ${r*0.7} ${r*1.3} Q ${r*0.6} ${r*1.5} ${r*0.75} ${r*1.6}`} /><path d={`M ${r*1.3} ${r*1.3} Q ${r*1.4} ${r*1.5} ${r*1.25} ${r*1.6}`} />{[0,1,2].map(i=><circle key={i} cx={r+wobble(seed+i*5,s*0.15)} cy={r*0.75+wobble(seed+i*5+1,s*0.1)} r={s*0.03} fill={palette.accent} stroke="none"/>)}</g>);
    case "chart":
      return (<g {...commonProps}><path d={sketchLine(s*0.2,s*0.78,s*0.8,s*0.78,seed)} /><path d={sketchLine(s*0.2,s*0.78,s*0.2,s*0.22,seed+10)} /><path d={sketchRect(s*0.28,s*0.52,s*0.1,s*0.26,seed+20)} fill={palette.fill} /><path d={sketchRect(s*0.44,s*0.36,s*0.1,s*0.42,seed+30)} fill={palette.accent+"50"} /><path d={sketchRect(s*0.6,s*0.28,s*0.1,s*0.5,seed+40)} fill={palette.fill} /><circle cx={s*0.33} cy={s*0.45} r={s*0.02} fill={palette.stroke} stroke="none"/><circle cx={s*0.49} cy={s*0.3} r={s*0.02} fill={palette.stroke} stroke="none"/></g>);
    case "envelope":
      return (<g {...commonProps}><path d={sketchRect(s*0.18,s*0.3,s*0.64,s*0.42,seed)} fill={palette.fill} /><path d={`M ${s*0.18+wobble(seed,1)} ${s*0.3+wobble(seed+1,1)} L ${r+wobble(seed+2,1)} ${r+wobble(seed+3,1)} L ${s*0.82+wobble(seed+4,1)} ${s*0.3+wobble(seed+5,1)}`} /><path d={sketchLine(s*0.3,s*0.58,s*0.5,s*0.58,seed+30)} stroke={palette.accent} strokeWidth={sw*0.7} /><path d={sketchLine(s*0.3,s*0.64,s*0.42,s*0.64,seed+40)} stroke={palette.accent} strokeWidth={sw*0.7} /></g>);
    case "code":
      return (<g {...commonProps}><path d={`M ${s*0.35} ${s*0.3} L ${s*0.2+wobble(seed,1)} ${r} L ${s*0.35} ${s*0.7}`} /><path d={`M ${s*0.65} ${s*0.3} L ${s*0.8+wobble(seed+5,1)} ${r} L ${s*0.65} ${s*0.7}`} /><path d={sketchLine(s*0.54,s*0.25,s*0.46,s*0.75,seed+10)} stroke={palette.accent} /><circle cx={s*0.2} cy={s*0.35} r={s*0.02} fill={palette.accent} stroke="none"/><circle cx={s*0.8} cy={s*0.65} r={s*0.02} fill={palette.accent} stroke="none"/></g>);
    case "coin":
      return (<g {...commonProps}><path d={sketchCircle(r,r,s*0.3,seed,12)} fill={palette.fill} /><path d={sketchCircle(r,r,s*0.22,seed+20,8)} /><path d={`M ${r-s*0.04} ${s*0.38} L ${r+s*0.04} ${s*0.38} L ${r} ${s*0.42} Q ${r-s*0.06} ${r} ${r} ${r+s*0.02} Q ${r+s*0.06} ${r+s*0.04} ${r-s*0.02} ${s*0.58} L ${r+s*0.04} ${s*0.62} L ${r-s*0.04} ${s*0.62}`} /></g>);
    case "person":
      return (<g {...commonProps}><path d={sketchCircle(r,s*0.32,s*0.12,seed,8)} fill={palette.fill} /><path d={`M ${s*0.3} ${s*0.78} Q ${s*0.3} ${s*0.52} ${r} ${s*0.48} Q ${s*0.7} ${s*0.52} ${s*0.7} ${s*0.78}`} fill={palette.fill} /><circle cx={r-s*0.04} cy={s*0.3} r={s*0.015} fill={palette.stroke} stroke="none"/><circle cx={r+s*0.04} cy={s*0.3} r={s*0.015} fill={palette.stroke} stroke="none"/></g>);
    case "rocket":
      return (<g {...commonProps}><path d={`M ${r} ${s*0.18} Q ${s*0.65} ${s*0.3} ${s*0.65} ${s*0.55} L ${s*0.58} ${s*0.7} L ${s*0.42} ${s*0.7} L ${s*0.35} ${s*0.55} Q ${s*0.35} ${s*0.3} ${r} ${s*0.18} Z`} fill={palette.fill} /><path d={sketchCircle(r,s*0.42,s*0.05,seed+10)} fill={palette.accent} /><path d={`M ${s*0.42} ${s*0.7} L ${s*0.44+wobble(seed,1)} ${s*0.82} L ${r} ${s*0.76} L ${s*0.56+wobble(seed+5,1)} ${s*0.82} L ${s*0.58} ${s*0.7}`} fill={palette.fill} /><path d={`M ${s*0.35} ${s*0.48} L ${s*0.25+wobble(seed+10,1)} ${s*0.6}`} /><path d={`M ${s*0.65} ${s*0.48} L ${s*0.75+wobble(seed+15,1)} ${s*0.6}`} /></g>);
    case "shield":
      return (<g {...commonProps}><path d={`M ${r} ${s*0.18} L ${s*0.72} ${s*0.3} L ${s*0.72} ${s*0.55} Q ${s*0.7} ${s*0.78} ${r} ${s*0.84} Q ${s*0.3} ${s*0.78} ${s*0.28} ${s*0.55} L ${s*0.28} ${s*0.3} Z`} fill={palette.fill} /><path d={`M ${s*0.4} ${s*0.52} L ${s*0.48} ${s*0.6+wobble(seed,1)} L ${s*0.62} ${s*0.42}`} strokeWidth={sw*1.3} /></g>);
    case "pen":
      return (<g {...commonProps}><path d={`M ${s*0.62} ${s*0.2} L ${s*0.78} ${s*0.36} L ${s*0.36} ${s*0.78} L ${s*0.2} ${s*0.82} L ${s*0.24} ${s*0.66} Z`} fill={palette.fill} /><path d={sketchLine(s*0.34,s*0.64,s*0.58,s*0.4,seed+10)} /><path d={`M ${s*0.2} ${s*0.82} L ${s*0.24} ${s*0.76}`} strokeWidth={sw*0.7} /><circle cx={s*0.7} cy={s*0.28} r={s*0.025} fill={palette.accent} stroke="none"/></g>);
    case "compass":
      return (<g {...commonProps}><path d={sketchCircle(r,r,s*0.3,seed,12)} fill={palette.fill} /><path d={`M ${r} ${s*0.28} L ${s*0.56} ${r} L ${r} ${s*0.72} L ${s*0.44} ${r} Z`} fill={palette.accent+"40"} /><path d={`M ${r} ${s*0.28} L ${s*0.56} ${r} L ${r} ${r}`} fill={palette.stroke} stroke="none" /><path d={`M ${r} ${r} L ${s*0.44} ${r} L ${r} ${s*0.72}`} fill={palette.stroke} stroke="none" /><circle cx={r} cy={r} r={s*0.03} fill={palette.bg} stroke={palette.stroke} strokeWidth={sw*0.7} /></g>);
    case "page":
      return (<g {...commonProps}><path d={`M ${s*0.26} ${s*0.2} L ${s*0.6} ${s*0.2} L ${s*0.74} ${s*0.34} L ${s*0.74} ${s*0.8} L ${s*0.26} ${s*0.8} Z`} fill={palette.fill} /><path d={`M ${s*0.6} ${s*0.2} L ${s*0.6} ${s*0.34} L ${s*0.74} ${s*0.34}`} />{[0.44,0.52,0.60,0.68].map((y,i)=>(<path key={i} d={sketchLine(s*0.34,s*y,s*(0.56+wobble(seed+i,0.06)),s*y,seed+i*10)} strokeWidth={sw*0.6} stroke={palette.accent}/>))}</g>);
    case "blocks":
      return (<g {...commonProps}><path d={sketchRect(s*0.2,s*0.5,s*0.26,s*0.26,seed)} fill={palette.fill} /><path d={sketchRect(s*0.54,s*0.5,s*0.26,s*0.26,seed+10)} fill={palette.accent+"40"} /><path d={sketchRect(s*0.37,s*0.24,s*0.26,s*0.26,seed+20)} fill={palette.fill} /><circle cx={s*0.33} cy={s*0.63} r={s*0.025} fill={palette.stroke} stroke="none"/><circle cx={s*0.67} cy={s*0.63} r={s*0.025} fill={palette.accent} stroke="none"/></g>);
    case "lightning":
      return (<g {...commonProps}><path d={`M ${s*0.52} ${s*0.16} L ${s*0.34+wobble(seed,1)} ${s*0.48} L ${s*0.48} ${s*0.48} L ${s*0.4+wobble(seed+5,1)} ${s*0.84} L ${s*0.66+wobble(seed+10,1)} ${s*0.46} L ${s*0.52} ${s*0.46} Z`} fill={palette.fill} stroke={palette.stroke} /><circle cx={s*0.38} cy={s*0.3} r={s*0.015} fill={palette.accent} stroke="none"/><circle cx={s*0.62} cy={s*0.7} r={s*0.015} fill={palette.accent} stroke="none"/></g>);
    case "nodes":
      return (<g {...commonProps}><path d={sketchLine(s*0.3,s*0.35,s*0.7,s*0.35,seed)} strokeWidth={sw*0.6} /><path d={sketchLine(s*0.3,s*0.35,s*0.5,s*0.65,seed+10)} strokeWidth={sw*0.6} /><path d={sketchLine(s*0.7,s*0.35,s*0.5,s*0.65,seed+20)} strokeWidth={sw*0.6} /><path d={sketchLine(s*0.5,s*0.65,s*0.75,s*0.72,seed+25)} strokeWidth={sw*0.6} /><path d={sketchCircle(s*0.3,s*0.35,s*0.07,seed+30)} fill={palette.fill} /><path d={sketchCircle(s*0.7,s*0.35,s*0.07,seed+40)} fill={palette.accent+"50"} /><path d={sketchCircle(s*0.5,s*0.65,s*0.07,seed+50)} fill={palette.fill} /><circle cx={s*0.75} cy={s*0.72} r={s*0.04} fill={palette.accent} stroke={palette.stroke} strokeWidth={sw*0.6} /></g>);
    case "sprout":
      return (<g {...commonProps}><path d={sketchLine(r,s*0.8,r,s*0.4,seed)} strokeWidth={sw*1.2} /><path d={`M ${r} ${s*0.45} Q ${s*0.3} ${s*0.3} ${s*0.28} ${s*0.2}`} fill="none" /><path d={`M ${r} ${s*0.45} Q ${s*0.32} ${s*0.38} ${s*0.28} ${s*0.2}`} fill={palette.fill} stroke="none" /><path d={`M ${r} ${s*0.36} Q ${s*0.68} ${s*0.22} ${s*0.72} ${s*0.18}`} fill="none" /><path d={`M ${r} ${s*0.36} Q ${s*0.66} ${s*0.28} ${s*0.72} ${s*0.18}`} fill={palette.accent+"40"} stroke="none" /><circle cx={r-s*0.02} cy={s*0.82} r={s*0.015} fill={palette.accent} stroke="none"/><circle cx={r+s*0.04} cy={s*0.82} r={s*0.015} fill={palette.accent} stroke="none"/></g>);
    case "frame":
      return (<g {...commonProps}><path d={sketchRect(s*0.22,s*0.26,s*0.56,s*0.42,seed)} fill={palette.fill} /><path d={sketchCircle(r,s*0.47,s*0.08,seed+10)} fill={palette.accent+"50"} /><path d={`M ${s*0.22} ${s*0.58} Q ${s*0.35} ${s*0.5} ${r} ${s*0.56} Q ${s*0.65} ${s*0.62} ${s*0.78} ${s*0.52}`} strokeWidth={sw*0.6} stroke={palette.accent} fill="none" /><circle cx={s*0.68} cy={s*0.32} r={s*0.025} fill={palette.accent} stroke="none"/></g>);
    case "flask":
      return (<g {...commonProps}><path d={`M ${s*0.4} ${s*0.2} L ${s*0.6} ${s*0.2} L ${s*0.6} ${s*0.42} L ${s*0.74} ${s*0.72} Q ${s*0.74} ${s*0.82} ${s*0.64} ${s*0.82} L ${s*0.36} ${s*0.82} Q ${s*0.26} ${s*0.82} ${s*0.26} ${s*0.72} L ${s*0.4} ${s*0.42} Z`} fill={palette.fill} /><path d={sketchLine(s*0.36,s*0.2,s*0.64,s*0.2,seed+10)} strokeWidth={sw*1.2} /><path d={`M ${s*0.32} ${s*0.62} Q ${r} ${s*0.56} ${s*0.68} ${s*0.62}`} strokeWidth={sw*0.6} stroke={palette.accent} fill="none" /><circle cx={s*0.42} cy={s*0.7} r={s*0.025} fill={palette.accent} stroke="none"/><circle cx={s*0.55} cy={s*0.66} r={s*0.02} fill={palette.stroke} opacity={0.4} stroke="none"/></g>);
    case "heart":
      return (<g {...commonProps}><path d={`M ${r} ${s*0.76} Q ${s*0.18} ${s*0.55} ${s*0.2} ${s*0.38} Q ${s*0.22} ${s*0.22} ${s*0.38} ${s*0.24} Q ${r} ${s*0.22} ${r} ${s*0.38} Q ${r} ${s*0.22} ${s*0.62} ${s*0.24} Q ${s*0.78} ${s*0.22} ${s*0.8} ${s*0.38} Q ${s*0.82} ${s*0.55} ${r} ${s*0.76} Z`} fill={palette.fill} /><circle cx={s*0.38} cy={s*0.38} r={s*0.02} fill={palette.accent} stroke="none"/></g>);
    default:
      return (<g {...commonProps}><path d={`M ${r} ${s*0.2} Q ${r+s*0.04} ${r} ${s*0.8} ${r} Q ${r+s*0.04} ${r+s*0.04} ${r} ${s*0.8} Q ${r-s*0.04} ${r+s*0.04} ${s*0.2} ${r} Q ${r-s*0.04} ${r} ${r} ${s*0.2} Z`} fill={palette.fill} /><circle cx={r} cy={r} r={s*0.04} fill={palette.accent} stroke="none"/></g>);
  }
};

export default function ProjectIcon({ title = "", description = "", index = 0, size = 40 }: { title?: string; description?: string; index?: number; size?: number }) {
  const concept = matchConcept(title, description);
  const palIdx = hashStr(title || `project-${index}`) % ICON_PALETTES.length;
  const palette = ICON_PALETTES[palIdx];
  const seed = hashStr(title || `seed-${index}`) % 1000;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: palette.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: `1px solid ${palette.stroke}18`,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {renderConcept(concept, palette, size, seed)}
      </svg>
    </div>
  );
}
