import React from "react";

interface ImageProps {
  src: string | { src: string };
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  className?: string;
  unoptimized?: boolean;
  [key: string]: any;
}

function Image({ src, alt, width, height, fill, priority, style, className, ...rest }: ImageProps) {
  const resolvedSrc = typeof src === "object" ? src.src : src;
  const imgStyle: React.CSSProperties = fill
    ? { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", ...style }
    : { ...style };

  return (
    <img
      src={resolvedSrc}
      alt={alt || ""}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      style={imgStyle}
      className={className}
      decoding="async"
    />
  );
}

export default Image;
