"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Member, ROLE_COLORS, ROLE_WEIGHTS } from "@/types";
import Avatar from "@/components/Avatar";

export default function BuildersPage() {
  const [builders, setBuilders] = useState<Member[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/members?time=${timeFilter}`)
      .then((r) => r.json())
      .then((d) => {
        setBuilders(d.builders);
        setLoading(false);
      });
  }, [timeFilter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-dark">
          Builder reputation leaderboard
        </h2>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(["all", "month", "week"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                timeFilter === filter
                  ? "bg-dark text-white"
                  : "bg-white text-secondary hover:text-dark"
              }`}
            >
              {filter === "all"
                ? "All time"
                : filter === "month"
                ? "This month"
                : "This week"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary text-sm">
          Loading...
        </div>
      ) : (
        <div>
          {builders.map((builder, i) => (
            <Link
              key={builder._id}
              href={`/members/${builder._id}`}
              className="flex items-center gap-4 py-3 px-2 border-b border-border-light hover:bg-surface transition-colors -mx-2"
            >
              <span className="font-mono text-sm text-secondary w-6 text-right shrink-0">
                {i + 1}
              </span>
              <Avatar name={builder.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dark">
                    {builder.name}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: ROLE_COLORS[builder.role],
                      backgroundColor: `${ROLE_COLORS[builder.role]}15`,
                    }}
                  >
                    {builder.role} &middot; {ROLE_WEIGHTS[builder.role] || 1}x
                  </span>
                </div>
                <span className="text-xs text-secondary">
                  {builder.company} &middot; {builder.city}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-lg font-bold text-dark">
                  {builder.builderScore}
                </div>
                <div className="text-xs text-secondary">
                  {builder.projectsShipped} shipped
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
