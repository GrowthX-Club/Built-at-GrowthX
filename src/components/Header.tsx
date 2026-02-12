"use client";

import { useState, useEffect } from "react";
import { Member } from "@/types";
import SubmitModal from "./SubmitModal";
import AuthModal from "./AuthModal";

export default function Header() {
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<Member | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  const handleSubmitClick = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setShowSubmit(true);
    }
  };

  return (
    <>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dark">
              Built at{" "}
              <span className="text-orange">GrowthX</span>
            </h1>
            <p className="text-sm text-secondary mt-0.5">
              Discover what the community is shipping
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-orange">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm text-dark font-medium hidden sm:block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleSubmitClick}
                  className="bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  + Submit project
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAuth(true)}
                  className="text-sm text-secondary hover:text-dark transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={handleSubmitClick}
                  className="bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  + Submit project
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showSubmit && (
        <SubmitModal
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            window.location.reload();
          }}
        />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(member) => {
            setUser(member);
            setShowAuth(false);
          }}
        />
      )}
    </>
  );
}
