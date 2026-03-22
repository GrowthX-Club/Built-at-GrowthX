"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C, T, type ActivityItem } from "@/types";
import { bxApi } from "@/lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function activityIcon(type: ActivityItem["type"]): string {
  switch (type) {
    case "vote": return "\u25B2";
    case "comment": return "\u{1F4AC}";
    case "project": return "\u{1F680}";
    default: return "\u2022";
  }
}

function activityText(item: ActivityItem): string {
  switch (item.type) {
    case "vote":
      return `voted on ${item.projectName}`;
    case "comment":
      return `commented on ${item.projectName}`;
    case "project":
      return `launched ${item.projectName}`;
    default:
      return `interacted with ${item.projectName}`;
  }
}

export default function ActivityFeed() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(() => {
    bxApi("/activity")
      .then(r => {
        if (!r.ok) { if (r.status === 404) setAvailable(false); return null; }
        return r.json();
      })
      .then(d => { if (d) setItems(d.activity || d.items || []); })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  if (!available) {
    return (
      <div style={{
        position: "sticky", top: 85,
        padding: "20px 0",
      }}>
        <div style={{
          fontSize: T.badge, fontWeight: 700, color: C.textMute,
          letterSpacing: "0.08em", textTransform: "uppercase",
          fontFamily: "var(--sans)", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 6,
            background: C.textMute, display: "inline-block",
          }} />
          Activity
        </div>
        <div style={{
          fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
          fontWeight: 400, lineHeight: 1.5,
        }}>
          Community activity feed coming soon.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "sticky", top: 85,
      padding: "20px 0",
    }}>
      <div style={{
        fontSize: T.badge, fontWeight: 700, color: C.textMute,
        letterSpacing: "0.08em", textTransform: "uppercase",
        fontFamily: "var(--sans)", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 6,
          background: "#2D7A3F", display: "inline-block",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        Activity
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 20, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: "80%", marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 10, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{
          fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
          fontWeight: 400, lineHeight: 1.5,
        }}>
          No activity yet. Be the first to vote or comment!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.slice(0, 15).map(item => (
            <button
              key={item.id}
              onClick={() => router.push(`/projects/${item.projectId}`)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "8px 4px", border: "none", background: "none",
                cursor: "pointer", textAlign: "left", width: "100%",
                borderRadius: 8, transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                fontSize: T.label, width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                {activityIcon(item.type)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: T.label, color: C.text, fontFamily: "var(--sans)",
                  fontWeight: 400, lineHeight: 1.4,
                }}>
                  <span style={{ fontWeight: 550 }}>{item.actorName}</span>
                  {" "}{activityText(item)}
                </div>
                <div style={{
                  fontSize: T.badge, color: C.textMute, fontFamily: "var(--sans)",
                  marginTop: 1,
                }}>
                  {timeAgo(item.timestamp)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
