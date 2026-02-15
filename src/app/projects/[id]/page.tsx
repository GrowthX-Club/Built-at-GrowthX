"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { C, STACK_META, type Project } from "@/types";
import Avatar from "@/components/Avatar";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => setProject(d.project));
  }, [params.id]);

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.textMute, fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: "none", color: C.textSec, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          &larr; Back
        </Link>
        <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text }}>{project.name}</span>
        {project.featured && (
          <span style={{ fontSize: 10, color: C.gold, background: C.goldSoft, border: `1px solid ${C.goldBorder}`, padding: "2px 8px", borderRadius: 6, fontFamily: "var(--mono)", fontWeight: 600 }}>
            &#x2726; Featured
          </span>
        )}
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* Hero */}
        <div style={{ height: 160, borderRadius: 16, background: `linear-gradient(135deg, ${project.heroColor}20, ${project.heroColor}08)`, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${project.heroColor}, ${project.heroColor}CC)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 700, fontFamily: "var(--serif)", boxShadow: `0 8px 24px ${project.heroColor}30` }}>
            {project.name[0]}
          </div>
        </div>

        {/* Title & meta */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 600, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{project.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.surfaceWarm, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.borderLight}` }}>
              <span style={{ fontSize: 12, color: C.textMute }}>&#9650;</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: C.text }}>{project.weighted}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: C.textMute, marginLeft: 4 }}>{project.raw} votes</span>
            </div>
          </div>
          <p style={{ fontSize: 17, color: C.textSec, lineHeight: 1.6, margin: "0 0 12px" }}>{project.tagline}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {project.buildathon && (
              <span style={{ fontSize: 12, color: C.textMute, fontFamily: "var(--mono)", background: C.surfaceWarm, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.borderLight}` }}>{project.buildathon}</span>
            )}
            <span style={{ fontSize: 12, color: C.textMute }}>{project.date}</span>
            <span style={{ fontSize: 12, color: C.textMute, background: C.surfaceWarm, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.borderLight}` }}>{project.category}</span>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>About</h2>
          <p style={{ fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>{project.description}</p>
        </div>

        {/* Gallery */}
        {project.gallery.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(project.gallery.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {project.gallery.map((item, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ height: 120, background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1] || item.colors[0]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "var(--mono)" }}>{item.type}</span>
                </div>
                <div style={{ padding: "8px 12px", background: C.surface }}>
                  <span style={{ fontSize: 12, color: C.textSec }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tech stack */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>Tech Stack</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {project.stack.map((tech) => {
              const meta = STACK_META[tech];
              return (
                <span key={tech} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px", borderRadius: 8, background: meta ? `${meta.bg}10` : C.surfaceWarm, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: "var(--mono)" }}>
                  {meta && (
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{meta.icon}</span>
                  )}
                  {tech}
                </span>
              );
            })}
          </div>
        </div>

        {/* Built by */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>Built by</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Primary builder */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surfaceWarm, borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
              <Avatar initials={project.builder.avatar} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{project.builder.name}</span>
                  {project.builder.company && project.builder.companyColor && (
                    <span style={{ fontSize: 11, color: project.builder.companyColor, fontFamily: "var(--mono)", background: `${project.builder.companyColor}10`, padding: "1px 6px", borderRadius: 4, border: `1px solid ${project.builder.companyColor}20` }}>
                      {project.builder.company}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: C.textSec }}>{project.builder.title} &middot; {project.builder.city}</span>
              </div>
            </div>
            {/* Collabs */}
            {project.collabs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                <Avatar initials={c.avatar} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{c.name}</span>
                    {c.company && c.companyColor && (
                      <span style={{ fontSize: 11, color: c.companyColor, fontFamily: "var(--mono)", background: `${c.companyColor}10`, padding: "1px 6px", borderRadius: 4, border: `1px solid ${c.companyColor}20` }}>
                        {c.company}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: C.textSec }}>{c.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
