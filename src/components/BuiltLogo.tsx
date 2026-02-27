"use client";

/** Built at GrowthX logo — renders the brand SVG at the given height. */
export default function BuiltLogo({ height = 40, onClick, style }: {
  height?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const width = Math.round(height * (358 / 259));
  return (
    <img
      src="/built-logo.svg"
      alt="Built at GrowthX"
      width={width}
      height={height}
      onClick={onClick}
      style={{ display: "block", cursor: onClick ? "pointer" : undefined, ...style }}
      draggable={false}
    />
  );
}
