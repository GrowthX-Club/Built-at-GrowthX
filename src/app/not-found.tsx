import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "120px auto",
        padding: "0 24px",
        textAlign: "center",
        fontFamily: "var(--sans)",
      }}
    >
      <h1
        style={{
          fontSize: 64,
          fontWeight: 700,
          fontFamily: "var(--serif)",
          color: "var(--c-text)",
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "var(--c-textSec)",
          margin: "16px 0 32px",
          lineHeight: 1.5,
        }}
      >
        This page doesn&apos;t exist. It may have been moved or the URL might be
        incorrect.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "var(--c-accent)",
          color: "var(--c-accentFg)",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
