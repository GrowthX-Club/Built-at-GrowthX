"use client";

import { C, ROLES, type BuilderProfile } from "@/types";
import Avatar from "./Avatar";

interface SignInPickerProps {
  builders: BuilderProfile[];
  onSignIn: (name: string) => void;
  onClose: () => void;
  currentUser?: BuilderProfile | null;
  onSignOut?: () => void;
}

export default function SignInPicker({
  builders,
  onSignIn,
  onClose,
  currentUser,
  onSignOut,
}: SignInPickerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: C.surface,
          borderRadius: 16,
          width: "100%",
          maxWidth: 360,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
                color: C.text,
              }}
            >
              Sign in to continue
            </h2>
            <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>
              Choose a profile to vote and comment
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: C.textMute,
              cursor: "pointer",
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: "8px 0" }}>
          {builders.map((b) => {
            const roleInfo = ROLES[b.role] || ROLES.member;
            const isActive = currentUser?.name === b.name;
            return (
              <button
                key={b.name}
                onClick={() => {
                  onSignIn(b.name);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 20px",
                  background: isActive ? C.accentSoft : "none",
                  border: "none",
                  borderBottom: `1px solid ${C.borderLight}`,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--sans)",
                }}
              >
                <Avatar initials={b.avatar} size={32} role={b.role} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMute }}>{b.city}</div>
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
          {currentUser && onSignOut && (
            <button
              onClick={() => {
                onSignOut();
                onClose();
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
      </div>
    </div>
  );
}
