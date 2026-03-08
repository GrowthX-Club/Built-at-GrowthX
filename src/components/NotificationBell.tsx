"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C, T, type BxNotification } from "@/types";
import { bxApi } from "@/lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function notificationText(n: BxNotification): string {
  switch (n.type) {
    case "vote":
      return `${n.actorName} voted on ${n.projectName}`;
    case "comment":
      return `${n.actorName} commented on ${n.projectName}`;
    case "reaction":
      return `${n.actorName} reacted to your comment on ${n.projectName}`;
    default:
      return `${n.actorName} interacted with ${n.projectName}`;
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<BxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(() => {
    bxApi("/notifications?unreadCount=true")
      .then(r => {
        if (!r.ok) { if (r.status === 404) setAvailable(false); return null; }
        return r.json();
      })
      .then(d => { if (d) setUnreadCount(d.unreadCount || 0); })
      .catch(() => setAvailable(false));
  }, []);

  const fetchNotifications = useCallback(() => {
    bxApi("/notifications")
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(d => {
        if (d) {
          setNotifications(d.notifications || []);
          setUnreadCount(d.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const markRead = useCallback(() => {
    bxApi("/notifications/read", { method: "POST" }).catch(() => {});
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open) {
      fetchNotifications();
      if (unreadCount > 0) markRead();
    }
    setOpen(v => !v);
  };

  if (!available) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          width: 32, height: 32, borderRadius: 32,
          border: `1px solid ${C.border}`, background: C.surface,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s",
          flexShrink: 0, padding: 0, position: "relative",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#D94F4F", color: "#fff",
            fontSize: 10, fontWeight: 700, fontFamily: "var(--sans)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", lineHeight: 1,
            border: `2px solid ${C.surface}`,
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 320,
          overflow: "hidden", zIndex: 100,
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: T.bodySm, fontWeight: 650, color: C.text, fontFamily: "var(--sans)" }}>
              Notifications
            </span>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markRead}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontSize: T.label, fontWeight: 450, color: C.textMute,
                  cursor: "pointer", fontFamily: "var(--sans)",
                }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textMute}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: "32px 16px", textAlign: "center",
              fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
            }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.slice(0, 8).map(n => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); router.push(`/projects/${n.projectId}`); }}
                  style={{
                    width: "100%", padding: "10px 16px", border: "none",
                    background: n.read ? "none" : C.accentSoft,
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "flex-start", gap: 10,
                    transition: "background 0.1s", fontFamily: "var(--sans)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = n.read ? C.accentSoft : C.borderLight}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : C.accentSoft}
                >
                  {!n.read && (
                    <span style={{
                      width: 6, height: 6, borderRadius: 6,
                      background: "#D94F4F", flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: T.label, fontWeight: n.read ? 400 : 500, color: C.text,
                      lineHeight: 1.4, marginBottom: 2,
                    }}>
                      {notificationText(n)}
                    </div>
                    {n.commentPreview && (
                      <div style={{
                        fontSize: T.label, color: C.textMute, lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 2,
                      }}>
                        &ldquo;{n.commentPreview}&rdquo;
                      </div>
                    )}
                    <div style={{ fontSize: T.badge, color: C.textMute }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
