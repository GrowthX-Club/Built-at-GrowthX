"use client";

import { useState, useEffect } from "react";

interface CityData {
  city: string;
  projectCount: number;
  totalScore: number;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => {
        setCities(d.cities);
        setLoading(false);
      });
  }, []);

  const maxScore = cities.length > 0 ? cities[0].totalScore : 1;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h2 className="text-lg font-bold text-dark mb-6">City leaderboard</h2>

      {loading ? (
        <div className="text-center py-12 text-secondary text-sm">
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          {cities.map((city, i) => (
            <div
              key={city.city}
              className="flex items-center gap-4 py-3 px-2"
            >
              <span className="font-mono text-sm text-secondary w-6 text-right shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-dark mb-1">
                  {city.city}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-border-light rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange transition-all"
                      style={{
                        width: `${(city.totalScore / maxScore) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-secondary shrink-0">
                    {city.projectCount} projects
                  </span>
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-dark shrink-0 w-16 text-right">
                {city.totalScore}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
