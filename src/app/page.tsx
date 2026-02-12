"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, Event } from "@/types";
import ProjectRow from "@/components/ProjectRow";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { eventData?: Event })[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<"trending" | "newest">("trending");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (search) params.set("search", search);
    if (eventFilter) params.set("eventId", eventFilter);

    const res = await fetch(`/api/projects?${params}`);
    const data = await res.json();
    setProjects(data.projects);
    setVotedIds(data.votedIds);
    setLoading(false);
  }, [sort, search, eventFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eid = params.get("event");
    const ename = params.get("eventName");
    if (eid) {
      setEventFilter(eid);
      setEventName(ename);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="px-6 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full max-w-sm border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
          />
        </div>
        <div className="flex items-center gap-2">
          {eventFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange text-xs rounded-full border border-orange/20">
              {eventName || "Event"}
              <button
                onClick={() => {
                  setEventFilter(null);
                  setEventName(null);
                  window.history.replaceState({}, "", "/");
                }}
                className="hover:text-orange-600 ml-0.5"
              >
                &times;
              </button>
            </span>
          )}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setSort("trending")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "trending"
                  ? "bg-dark text-white"
                  : "bg-white text-secondary hover:text-dark"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setSort("newest")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "newest"
                  ? "bg-dark text-white"
                  : "bg-white text-secondary hover:text-dark"
              }`}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary text-sm">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-secondary text-sm">
          No projects found
        </div>
      ) : (
        <div>
          {projects.map((project, i) => (
            <ProjectRow
              key={project._id}
              project={project}
              hasVoted={votedIds.includes(project._id)}
              rank={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
