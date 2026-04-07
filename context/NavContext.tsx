"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

interface VoteState {
  projectId: string | number;
  hasVoted: boolean;
  count: number;
  onVote: (id: string | number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
  onUnauthClick?: () => void;
}

interface NavOverride {
  title: string;
  backHref: string;
}

interface NavContextValue {
  override: NavOverride | null;
  setNavOverride: (override: NavOverride) => void;
  clearNavOverride: () => void;
  voteState: VoteState | null;
  showVoteInNav: boolean;
  setVoteState: (state: VoteState | null) => void;
  setShowVoteInNav: (show: boolean) => void;
}

const NavContext = createContext<NavContextValue>({
  override: null,
  setNavOverride: () => {},
  clearNavOverride: () => {},
  voteState: null,
  showVoteInNav: false,
  setVoteState: () => {},
  setShowVoteInNav: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<NavOverride | null>(null);
  const [voteState, setVoteStateRaw] = useState<VoteState | null>(null);
  const [showVoteInNav, setShowVoteInNav] = useState(false);
  const voteStateRef = useRef<VoteState | null>(null);

  const setNavOverride = useCallback((o: NavOverride) => {
    setOverride(o);
  }, []);

  const clearNavOverride = useCallback(() => {
    setOverride(null);
    setVoteStateRaw(null);
    voteStateRef.current = null;
    setShowVoteInNav(false);
  }, []);

  const setVoteState = useCallback((state: VoteState | null) => {
    voteStateRef.current = state;
    setVoteStateRaw(state);
  }, []);

  return (
    <NavContext.Provider value={{ override, setNavOverride, clearNavOverride, voteState, showVoteInNav, setVoteState, setShowVoteInNav }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavOverride() {
  return useContext(NavContext);
}
