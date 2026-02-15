"use client";

import { useState, useEffect } from "react";
import {
  C,
  ROLES,
  type Project,
  type BuildingProject,
  type BuilderProfile,
  type CityData,
  type ThreadData,
  type Reaction,
} from "@/types";
import Header from "@/components/Header";
import Navigation, { type TabKey } from "@/components/Navigation";
import ProjectCard from "@/components/ProjectRow";
import SubmitModal from "@/components/SubmitModal";
import Avatar from "@/components/Avatar";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idea: C.textMute,
    prototyping: C.gold,
    beta: C.green,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        color: colors[status] || C.textMute,
        fontFamily: "var(--mono)",
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: colors[status] || C.textMute,
        }}
      />
      {status}
    </span>
  );
}

function ReactionBar({ reactions }: { reactions: Reaction[] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {reactions.map((r, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 20,
            fontSize: 12,
            background: r.mine ? `${C.accent}08` : C.surfaceWarm,
            border: `1px solid ${r.mine ? `${C.accent}20` : C.borderLight}`,
            cursor: "pointer",
            fontFamily: "var(--mono)",
          }}
        >
          <span style={{ fontSize: 14 }}>{r.emoji.display}</span>
          <span style={{ color: C.textSec, fontWeight: 500 }}>{r.count}</span>
        </span>
      ))}
    </div>
  );
}

function ThreadCard({ thread }: { thread: ThreadData }) {
  const [expanded, setExpanded] = useState(false);
  const roleInfo = ROLES[thread.author.role] || ROLES.member;

  return (
    <div
      style={{
        background: C.surface,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Avatar initials={thread.author.avatar} role={thread.author.role} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              {thread.author.name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: roleInfo.color,
                background: roleInfo.bg,
                padding: "1px 6px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              {roleInfo.label}
            </span>
            {thread.author.company && thread.author.companyColor && (
              <span
                style={{
                  fontSize: 10,
                  color: thread.author.companyColor,
                  fontFamily: "var(--mono)",
                }}
              >
                {thread.author.company}
              </span>
            )}
            <span style={{ fontSize: 11, color: C.textMute }}>
              {thread.time}
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              color: C.text,
              lineHeight: 1.6,
              margin: "8px 0 10px",
            }}
          >
            {thread.content}
          </p>
          <ReactionBar reactions={thread.reactions} />
        </div>
      </div>

      {thread.replies.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              fontSize: 12,
              color: C.textSec,
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: "var(--sans)",
              fontWeight: 500,
            }}
          >
            {expanded
              ? "Hide replies"
              : `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}`}
          </button>
          {expanded && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${C.borderLight}`,
              }}
            >
              {thread.replies.map((reply, i) => {
                const rRole = ROLES[reply.author.role] || ROLES.member;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 14,
                      paddingLeft: 16,
                    }}
                  >
                    <Avatar
                      initials={reply.author.avatar}
                      size={28}
                      role={reply.author.role}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {reply.author.name}
                        </span>
                        {reply.author.isCreator && (
                          <span
                            style={{
                              fontSize: 9,
                              color: C.gold,
                              background: C.goldSoft,
                              border: `1px solid ${C.goldBorder}`,
                              padding: "0 5px",
                              borderRadius: 3,
                              fontFamily: "var(--mono)",
                              fontWeight: 600,
                            }}
                          >
                            OP
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            color: rRole.color,
                            background: rRole.bg,
                            padding: "1px 5px",
                            borderRadius: 3,
                          }}
                        >
                          {rRole.label}
                        </span>
                        <span style={{ fontSize: 11, color: C.textMute }}>
                          {reply.time}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: C.text,
                          lineHeight: 1.5,
                          margin: "4px 0 6px",
                        }}
                      >
                        {reply.content}
                      </p>
                      <ReactionBar reactions={reply.reactions} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState<TabKey>("built");
  const [showSubmit, setShowSubmit] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [building, setBuilding] = useState<BuildingProject[]>([]);
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [threads, setThreads] = useState<ThreadData[]>([]);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects));
    fetch("/api/building").then((r) => r.json()).then((d) => setBuilding(d.building));
    fetch("/api/members").then((r) => r.json()).then((d) => setBuilders(d.builders));
    fetch("/api/cities").then((r) => r.json()).then((d) => setCities(d.cities));
    fetch("/api/threads").then((r) => r.json()).then((d) => setThreads(d.threads));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Header onSubmit={() => setShowSubmit(true)} />
      <Navigation active={tab} onChange={setTab} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>
        {tab === "built" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                Discussion
              </h2>
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        {tab === "building" && (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>
              Currently Building
            </h2>
            <p style={{ fontSize: 14, color: C.textSec, marginBottom: 20 }}>
              Work in progress from the community
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {building.map((b) => {
                const roleInfo = ROLES[b.builder.role] || ROLES.member;
                return (
                  <div key={b.id} className="animate-fadeUp" style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>{b.name}</h3>
                        <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>{b.tagline}</p>
                      </div>
                      <StatusDot status={b.status} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Avatar initials={b.builder.avatar} size={24} role={b.builder.role} />
                      <span style={{ fontSize: 13, color: C.textSec }}>{b.builder.name}</span>
                      <span style={{ fontSize: 10, color: roleInfo.color, background: roleInfo.bg, padding: "1px 5px", borderRadius: 3 }}>{roleInfo.label}</span>
                      <span style={{ fontSize: 11, color: C.textMute }}>{b.builder.city}</span>
                    </div>
                    <div style={{ background: C.surfaceWarm, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.borderLight}`, marginBottom: b.help ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: C.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>Build Log</span>
                        <span style={{ fontSize: 11, color: C.textMute }}>{b.logDate}</span>
                      </div>
                      <p style={{ fontSize: 13, color: C.text, margin: 0, fontFamily: "var(--mono)", lineHeight: 1.5 }}>{b.log}</p>
                    </div>
                    {b.help && (
                      <div style={{ background: C.blueSoft, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.blue }}>
                        <strong>Looking for help:</strong> {b.help}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: C.textMute, fontFamily: "var(--mono)" }}>{b.watchers} watchers</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "builders" && (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>Builder Leaderboard</h2>
            <p style={{ fontSize: 14, color: C.textSec, marginBottom: 20 }}>Ranked by reputation across all shipped projects</p>
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {builders.map((b, i) => {
                const roleInfo = ROLES[b.role] || ROLES.member;
                return (
                  <div key={b.name} className="animate-fadeUp" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < builders.length - 1 ? `1px solid ${C.borderLight}` : "none", animationDelay: `${i * 0.04}s` }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: C.textMute, width: 24, textAlign: "right" }}>{i + 1}</span>
                    <Avatar initials={b.avatar} role={b.role} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{b.name}</span>
                        <span style={{ fontSize: 10, color: roleInfo.color, background: roleInfo.bg, padding: "1px 6px", borderRadius: 4 }}>{roleInfo.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: C.textSec }}>{b.bio} &middot; {b.city}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: C.text }}>{b.rep}</div>
                      <div style={{ fontSize: 11, color: C.textMute, fontFamily: "var(--mono)" }}>{b.shipped} shipped</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "cities" && (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>Cities</h2>
            <p style={{ fontSize: 14, color: C.textSec, marginBottom: 20 }}>Where the GrowthX community is building</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {cities.map((city, i) => (
                <div key={city.name} className="animate-fadeUp" style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", animationDelay: `${i * 0.04}s` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{city.flag}</span>
                      <span style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, color: C.text }}>{city.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.green, fontFamily: "var(--mono)", fontWeight: 500 }}>{city.trend}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, color: C.text }}>{city.builders}</div>
                      <div style={{ fontSize: 11, color: C.textMute }}>builders</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, color: C.text }}>{city.shipped}</div>
                      <div style={{ fontSize: 11, color: C.textMute }}>shipped</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
