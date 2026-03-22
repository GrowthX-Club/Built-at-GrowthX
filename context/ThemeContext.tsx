"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  triggerFlip: () => void;
  isAnimating: boolean;
  setIsAnimating: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  triggerFlip: () => {},
  isAnimating: false,
  setIsAnimating: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync with DOM on mount (the blocking script may have already set data-theme)
  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme");
    if (stored === "dark") setTheme("dark");
  }, []);

  const triggerFlip = useCallback(() => {
    if (isAnimating) return;
    const next: Theme = theme === "light" ? "dark" : "light";
    setIsAnimating(true);
    // The actual theme swap + animation phases are driven by CanvasFlip.
    // We just set the target here; CanvasFlip reads it via context.
    setTheme(next);
    try { localStorage.setItem("bx-theme", next); } catch {}
  }, [theme, isAnimating]);

  return (
    <ThemeContext.Provider value={{ theme, triggerFlip, isAnimating, setIsAnimating }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
