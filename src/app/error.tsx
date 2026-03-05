"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          fontSize: 48,
          fontWeight: 700,
          fontFamily: "var(--serif)",
          color: "var(--c-text)",
          margin: 0,
          lineHeight: 1,
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "var(--c-textSec)",
          margin: "16px 0 32px",
          lineHeight: 1.5,
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "var(--c-accent)",
          color: "var(--c-accentFg)",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
