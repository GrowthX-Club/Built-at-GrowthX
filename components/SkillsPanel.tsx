import { Link } from "react-router";
import { type Project, teamOf } from "@/types";
import { Faces, makersLine } from "@/components/ProjectCard";

// Skill cards, ported from the Raycast Store's extension cards: name with Install on the right, one or two lines on
// what it does, then who made it and how often it was installed (shown from 10 installs up).
export function SkillCard({ skill: s }: { skill: Project }) {
  const href = `/projects/${s.slug || s.id}`;
  const installs = s.skill?.downloads ?? 0;
  return (
    <article className="scard">
      <div className="scard-head">
        <h3 className="scard-name"><Link to={href} prefetch="intent">{s.name}</Link></h3>
        <Link to={`${href}#install`} className="btn-outline install" aria-label={`Install ${s.name}`}>Install</Link>
      </div>
      <p className="scard-desc">{s.tagline}</p>
      <div className="scard-meta">
        <Faces people={teamOf(s)} max={1} />
        <span>{makersLine(s)}{installs >= 10 ? ` · ${installs.toLocaleString()} installs` : ""}</span>
      </div>
    </article>
  );
}

// The Skills marketplace on the home page: the most-installed skills, Raycast's "Featured" row.
export default function SkillsPanel({ skills }: { skills: Project[] }) {
  if (skills.length === 0) return null;
  return (
    <section className="section" aria-labelledby="skills-title">
      <div className="section-head">
        <div>
          <h2 className="bx-section-title" id="skills-title">Skills</h2>
          <p className="page-sub">Skills members built to teach your AI a job they know. Add them to Claude, ChatGPT, Claude Code or Codex.</p>
        </div>
        <Link to="/skills" className="text-link">All skills →</Link>
      </div>
      <div className={`sgrid${skills.length >= 3 ? " three" : ""}`}>
        {skills.map(s => <SkillCard key={s.id} skill={s} />)}
      </div>
    </section>
  );
}
