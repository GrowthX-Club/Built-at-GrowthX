"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface NavOverride {
  title: string;
  backHref: string;
}

interface NavContextValue {
  override: NavOverride | null;
  setNavOverride: (override: NavOverride) => void;
  clearNavOverride: () => void;
}

const NavContext = createContext<NavContextValue>({
  override: null,
  setNavOverride: () => {},
  clearNavOverride: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<NavOverride | null>(null);

  const setNavOverride = useCallback((o: NavOverride) => {
    setOverride(o);
  }, []);

  const clearNavOverride = useCallback(() => {
    setOverride(null);
  }, []);

  return (
    <NavContext.Provider value={{ override, setNavOverride, clearNavOverride }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavOverride() {
  return useContext(NavContext);
}
