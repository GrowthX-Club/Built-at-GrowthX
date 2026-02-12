"use client";

import { useState, useEffect } from "react";
import { Member, ROLE_COLORS } from "@/types";
import Avatar from "./Avatar";

interface AuthModalProps {
  onClose: () => void;
  onAuth: (member: Member) => void;
}

export default function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.builders);
        setLoading(false);
      });
  }, []);

  const handleSelect = async (member: Member) => {
    await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member._id }),
    });
    onAuth(member);
  };

  const handleGuest = async () => {
    await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: null }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-dark">Sign in to GrowthX</h2>
          <p className="text-sm text-secondary mt-0.5">
            Select a member profile to continue (demo mode)
          </p>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-3">
          {loading ? (
            <div className="text-center py-8 text-secondary text-sm">
              Loading members...
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleSelect(member)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors text-left"
                >
                  <Avatar name={member.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark">
                        {member.name}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          color: ROLE_COLORS[member.role],
                          backgroundColor: `${ROLE_COLORS[member.role]}15`,
                        }}
                      >
                        {member.role}
                      </span>
                    </div>
                    <span className="text-xs text-secondary">
                      {member.company} · {member.city}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border">
          <button
            onClick={handleGuest}
            className="w-full text-sm text-secondary hover:text-dark transition-colors py-2"
          >
            Continue as guest (1x vote weight)
          </button>
        </div>
      </div>
    </div>
  );
}
