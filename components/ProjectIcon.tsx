// Project icon — two sources:
//  1. `iconId` of the form "ph:<name>" → a Phosphor duotone glyph vendored in
//     /public/ph/, rendered via CSS mask so it takes any tile color (the
//     duotone layer opacities survive as alpha in the mask).
//  2. Anything else → the legacy 50-doodle agent-icon repository
//     (stored category id, else keyword match, deterministic color hash).

import AgentIcon, { matchCategory, hashStr, AGENT_CATEGORIES } from "@/assets/agentIcons";

// Soft tile + strong glyph pairs; picked deterministically from the name hash
// so a project keeps its colors everywhere, forever.
const PH_TILES: Array<{ bg: string; fg: string }> = [
  { bg: "#FDECEC", fg: "#D64545" },
  { bg: "#E8F1FD", fg: "#2255CC" },
  { bg: "#E9F7EF", fg: "#2D7A3F" },
  { bg: "#FDF6E3", fg: "#B8962E" },
  { bg: "#F3ECFD", fg: "#7C3AED" },
  { bg: "#E6F7F6", fg: "#0F766E" },
  { bg: "#FDF0E6", fg: "#C2540A" },
  { bg: "#EBF0FA", fg: "#1D4ED8" },
  { bg: "#EFF7E6", fg: "#4D7C0F" },
  { bg: "#FDEBF3", fg: "#BE185D" },
];

function PhosphorTile({ name, seed, size }: { name: string; seed: number; size: number }) {
  const { bg, fg } = PH_TILES[seed % PH_TILES.length];
  const glyph = Math.round(size * 0.62);
  const maskUrl = `url(/ph/${name}.svg)`;
  return (
    <div
      className="project-icon"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.25)),
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: glyph,
          height: glyph,
          backgroundColor: fg,
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          display: "block",
        }}
      />
    </div>
  );
}

export default function ProjectIcon({
  title = "",
  description = "",
  index = 0,
  size = 40,
  iconId,
}: {
  title?: string;
  description?: string;
  index?: number;
  size?: number;
  /** Stored icon id — "ph:<phosphor-name>" or a legacy doodle category id */
  iconId?: string;
}) {
  const seed = hashStr(title || `project-${index}`);

  // Phosphor path: "ph:heartbeat" → /ph/heartbeat.svg. Name is validated
  // upstream against the vendored set; sanitize anyway so a bad value can't
  // form a foreign URL.
  if (iconId && iconId.startsWith("ph:")) {
    const name = iconId.slice(3);
    if (/^[a-z0-9-]+$/.test(name)) {
      return <PhosphorTile name={name} seed={seed} size={size} />;
    }
  }

  // Legacy stored doodle category id.
  if (iconId && !iconId.startsWith("ph:")) {
    return <AgentIcon category={iconId} size={size} colorSeed={seed % AGENT_CATEGORIES.length} />;
  }

  // No stored icon: keyword-match a doodle.
  const cat = matchCategory(`${title} ${description}`);
  return <AgentIcon category={cat} size={size} colorSeed={seed % AGENT_CATEGORIES.length} />;
}
