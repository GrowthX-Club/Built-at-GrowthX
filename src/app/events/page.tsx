"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event, EVENT_TYPE_COLORS } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-secondary text-sm">
        Loading events...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h2 className="text-lg font-bold text-dark mb-6">Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <button
            key={event._id}
            onClick={() =>
              router.push(
                `/?event=${event._id}&eventName=${encodeURIComponent(event.name)}`
              )
            }
            className="text-left border border-border rounded-lg p-5 hover:border-orange/30 hover:bg-surface transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    EVENT_TYPE_COLORS[event.type] || "#8899AA",
                }}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: EVENT_TYPE_COLORS[event.type] || "#8899AA",
                }}
              >
                {event.type.replace("_", " ")}
              </span>
            </div>
            <h3 className="font-semibold text-dark text-sm mb-1">
              {event.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-secondary mb-3">
              <span>{event.city}</span>
              <span>&middot;</span>
              <span>
                {new Date(event.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-dark">
                {event.projectCount}
              </span>
              <span className="text-xs text-secondary">projects</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
