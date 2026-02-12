"use client";

import { useState, useEffect } from "react";
import { Event, CATEGORY_OPTIONS, Member } from "@/types";

interface SubmitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitModal({ onClose, onSuccess }: SubmitModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [description, setDescription] = useState("");
  const [buildLog, setBuildLog] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([eventsData, membersData]) => {
      setEvents(eventsData.events);
      setMembers(membersData.builders);
    });
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      !teamMemberIds.includes(m._id) &&
      m.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return;

    setLoading(true);
    try {
      const team = teamMemberIds.map((id) => {
        const member = members.find((m) => m._id === id);
        return {
          memberId: id,
          name: member?.name || "",
          avatar: member?.avatar || "",
          role: "Builder",
        };
      });

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline,
          description,
          buildLog,
          logo: "",
          screenshots: [],
          demoVideo: "",
          productUrl,
          category,
          event: eventId || undefined,
          team: team.length > 0 ? team : undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-bold text-dark">Submit a project</h2>
          <p className="text-sm text-secondary mt-0.5">
            Share what you&apos;ve built with the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Project name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ContextPilot"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Tagline *
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One sentence about your product"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Product URL
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://yourproduct.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your product..."
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Build log
            </label>
            <textarea
              value={buildLog}
              onChange={(e) => setBuildLog(e.target.value)}
              placeholder="Share your journey - why you built it and how..."
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Event
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:border-orange"
              >
                <option value="">No event (independent)</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:border-orange"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Team members (up to 3)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {teamMemberIds.map((id) => {
                const member = members.find((m) => m._id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange text-xs rounded-full"
                  >
                    {member?.name}
                    <button
                      type="button"
                      onClick={() =>
                        setTeamMemberIds(teamMemberIds.filter((i) => i !== id))
                      }
                      className="hover:text-orange-600"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
            {teamMemberIds.length < 3 && (
              <div className="relative">
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:outline-none focus:border-orange"
                />
                {teamSearch && filteredMembers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                    {filteredMembers.slice(0, 5).map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => {
                          setTeamMemberIds([...teamMemberIds, member._id]);
                          setTeamSearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-dark hover:bg-surface"
                      >
                        {member.name}{" "}
                        <span className="text-secondary">
                          · {member.company}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:text-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !tagline.trim()}
              className="flex-1 bg-orange text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
