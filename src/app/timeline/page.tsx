"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WeekData {
  week: number;
  count: number;
  projects: string[];
}

export default function TimelinePage() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => {
        setWeeks(d.weeks);
        setLoading(false);
      });
  }, []);

  const maxCount = weeks.length > 0 ? Math.max(...weeks.map((w) => w.count)) : 1;

  const handleWeekClick = (week: number) => {
    setSelectedWeek(week === selectedWeek ? null : week);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h2 className="text-lg font-bold text-dark mb-6">
        Projects shipped per week
      </h2>

      {loading ? (
        <div className="text-center py-12 text-secondary text-sm">
          Loading...
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2 h-48 mb-6">
            {weeks.map((week) => (
              <button
                key={week.week}
                onClick={() => handleWeekClick(week.week)}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <span className="text-xs font-mono text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  {week.count}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    selectedWeek === week.week
                      ? "bg-orange"
                      : "bg-border hover:bg-orange/40"
                  }`}
                  style={{
                    height: `${(week.count / maxCount) * 100}%`,
                    minHeight: "8px",
                  }}
                />
                <span className="text-[10px] font-mono text-secondary">
                  W{week.week}
                </span>
              </button>
            ))}
          </div>

          {selectedWeek && (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dark">
                  Week {selectedWeek}
                </h3>
                <button
                  onClick={() =>
                    router.push(`/?week=${selectedWeek}`)
                  }
                  className="text-xs text-orange hover:text-orange-600 font-medium"
                >
                  View all &rarr;
                </button>
              </div>
              <div className="space-y-1">
                {weeks
                  .find((w) => w.week === selectedWeek)
                  ?.projects.map((name, i) => (
                    <div key={i} className="text-sm text-dark/80">
                      {name}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
