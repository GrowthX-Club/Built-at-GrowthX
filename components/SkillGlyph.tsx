import { hashStr } from "@/assets/agentIcons";

const GLYPH_COLORS = [
  "#B8962E",
  "#5B21B6",
  "#2D7A3F",
  "#0080FF",
  "#92400E",
  "#0C2451",
  "#DC2626",
  "#166534",
  "#BE185D",
  "#0F766E",
];

/** Two letters from a kebab-case slug: "art-direction" → "AD", "impeccable" → "IM". */
function initials(name: string): string {
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

export default function SkillGlyph({ name, size = 44 }: { name: string; size?: number }) {
  const color = GLYPH_COLORS[hashStr(name) % GLYPH_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: Math.round(size * 0.36),
        fontWeight: 500,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}
