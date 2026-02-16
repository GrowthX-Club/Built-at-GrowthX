"use client";

import { useState } from "react";
import { C, ROLES, type BuilderProfile } from "@/types";
import Avatar from "./Avatar";

export default function Header({
  onSubmit,
  user,
  onSignIn,
  onSignOut,
  builders,
}: {
  onSubmit?: () => void;
  user: BuilderProfile | null;
  onSignIn?: (name: string) => void;
  onSignOut?: () => void;
  builders: BuilderProfile[];
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <header
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "-0.02em",
          }}
        >
          Built
        </span>
        <span
          style={{
            fontSize: 11,
            color: C.textMute,
            fontFamily: "var(--mono)",
            padding: "2px 8px",
            background: C.surfaceWarm,
            borderRadius: 4,
            border: `1px solid ${C.borderLight}`,
          }}
        >
          at GrowthX
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            color: C.textSec,
            fontFamily: "var(--mono)",
          }}
        >
          6 shipped &middot; 4 building
        </span>
        {user && (
          <button
            onClick={onSubmit}
            style={{
              background: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--sans)",
            }}
          >
            + Submit
          </button>
        )}

        {/* User avatar / sign in */}
        <div style={{ position: "relative" }}>
          {user ? (
            <button
              onClick={() => setShowPicker(!showPicker)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar initials={user.avatar} size={32} role={user.role} />
              <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>
                {user.name.split(" ")[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowPicker(!showPicker)}
              style={{
                background: "none",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                color: C.textSec,
                cursor: "pointer",
                fontFamily: "var(--sans)",
              }}
            >
              Sign in
            </button>
          )}

          {/* Picker dropdown */}
          {showPicker && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                width: 280,
                maxHeight: 360,
                overflow: "auto",
                zIndex: 200,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.borderLight}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                Switch profile
              </div>
              {builders.map((b) => {
                const roleInfo = ROLES[b.role] || ROLES.member;
                const isActive = user?.name === b.name;
                return (
                  <button
                    key={b.name}
                    onClick={() => {
                      onSignIn?.(b.name);
                      setShowPicker(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 16px",
                      background: isActive ? C.accentSoft : "none",
                      border: "none",
                      borderBottom: `1px solid ${C.borderLight}`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    <Avatar initials={b.avatar} size={28} role={b.role} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMute }}>
                        {b.city}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: roleInfo.color,
                        background: roleInfo.bg,
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {roleInfo.label}
                    </span>
                  </button>
                );
              })}
              {user && (
                <button
                  onClick={() => {
                    onSignOut?.();
                    setShowPicker(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: C.textMute,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "var(--sans)",
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
