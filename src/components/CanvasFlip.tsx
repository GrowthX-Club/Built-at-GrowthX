"use client";

import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * CanvasFlip — wraps page content and performs a 5-phase 3D card-flip animation
 * when the theme toggle is triggered.
 *
 * Phases (~1100ms total):
 *   1. Shrink   (300ms) — scale(0.8) + border-radius: 24px + overflow: hidden
 *   2. Half-flip (250ms) — rotateY(90deg) — content goes edge-on
 *   3. Swap      (0ms)  — toggle data-theme, set rotateY(-90deg) instantly
 *   4. Half-flip back (250ms) — rotateY(0deg) — content unfolds
 *   5. Grow     (300ms) — scale(1) + border-radius: 0
 */
export default function CanvasFlip({ children }: { children: React.ReactNode }) {
  const { theme, isAnimating, setIsAnimating } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevThemeRef = useRef(theme);

  const runAnimation = useCallback((targetTheme: string) => {
    const el = wrapperRef.current;
    if (!el) { setIsAnimating(false); return; }

    const scrollY = window.scrollY;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Helper to wait for a transitionend on "transform"
    const waitTransform = (timeout: number): Promise<void> =>
      new Promise((resolve) => {
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        el.addEventListener("transitionend", function handler(e) {
          if (e.propertyName === "transform") {
            el.removeEventListener("transitionend", handler);
            done();
          }
        });
        setTimeout(done, timeout + 100); // fallback
      });

    // Phase 1: Shrink
    el.style.transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 300ms ease";
    el.style.transform = "scale(0.8)";
    el.style.borderRadius = "24px";
    el.style.overflow = "hidden";

    waitTransform(300).then(() => {
      // Phase 2: Half-flip to 90deg
      el.style.transition = "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "scale(0.8) rotateY(90deg)";

      return waitTransform(250);
    }).then(() => {
      // Phase 3: Swap theme + instant flip to -90deg
      document.documentElement.setAttribute("data-theme", targetTheme);
      el.style.transition = "none";
      el.style.transform = "scale(0.8) rotateY(-90deg)";

      // Force reflow
      void el.offsetHeight;

      // Phase 4: Half-flip back to 0
      el.style.transition = "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "scale(0.8) rotateY(0deg)";

      return waitTransform(250);
    }).then(() => {
      // Phase 5: Grow back
      el.style.transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 300ms ease";
      el.style.transform = "scale(1)";
      el.style.borderRadius = "0px";

      return waitTransform(300);
    }).then(() => {
      // Cleanup
      el.style.transition = "";
      el.style.transform = "";
      el.style.borderRadius = "";
      el.style.overflow = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      setIsAnimating(false);
    });
  }, [setIsAnimating]);

  // Watch for theme changes to trigger animation
  useEffect(() => {
    if (theme !== prevThemeRef.current && isAnimating) {
      runAnimation(theme);
    }
    prevThemeRef.current = theme;
  }, [theme, isAnimating, runAnimation]);

  return (
    <div style={{ perspective: 1200, transformStyle: "flat" }}>
      <div
        ref={wrapperRef}
        style={{ transformOrigin: "center center", willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
