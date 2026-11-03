import { Link } from "react-router";
import { type Project } from "@/types";

// The Skills marketplace on the home page: the most-installed skills, each with Install as its action
// (opens the skill's install box). Submitting stays on the one Submit button in the nav.
export default function SkillsPanel({ skills }: { skills: Project[] }) {
  if (skills.length === 0) return null;
  return (
    <section className="skills-panel" aria-labelledby="skills-title">
      <div className="section-head">
        <h2 className="bx-section-title" id="skills-title">Skills</h2>
        <Link to="/skills" className="text-link">All skills →</Link>
      </div>
      <p className="skills-sub">Skills members built to teach your AI a job they know. Add them to Claude, ChatGPT, Claude Code or Codex.</p>
      <ul className="skills-list">
        {skills.map(s => {
          const href = `/projects/${s.slug || s.id}`;
          const installs = s.skill?.downloads ?? 0;
          return (
            <li key={s.id} className="skill-item">
              <div style={{ minWidth: 0 }}>
                <Link to={href} className="skill-name" prefetch="intent">{s.name}</Link>
                <p className="skill-tagline">{s.tagline}</p>
                <p className="skill-meta">{s.builder.name}{installs >= 10 ? ` · ${installs.toLocaleString()} installs` : ""}</p>
              </div>
              <Link to={`${href}#install`} className="btn-outline skill-install" aria-label={`Install ${s.name}`}>Install</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
