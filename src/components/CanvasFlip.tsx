"use client";

import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * CanvasFlip — wraps page content and performs a "light source" animation
 * when the theme toggle is triggered. The nav bar acts as a tubelight fixture.
 *
 * Light -> Dark (~950ms): Light retreats upward into the nav bar
 * Dark -> Light (~1700ms): Tubelight flickers on, then light sweeps down the page
 */
export default function CanvasFlip({ children }: { children: React.ReactNode }) {
  const { theme, isAnimating, setIsAnimating } = useTheme();
  const prevThemeRef = useRef(theme);

  const runLightToDark = useCallback(() => {
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Toggle theme immediately — dark content renders under the overlay
    document.documentElement.setAttribute("data-theme", "dark");

    // Full-page overlay in old light color with warm gradient bottom edge
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 140vh;
      z-index: 45;
      pointer-events: none;
      will-change: transform;
      background: linear-gradient(
        to bottom,
        #F8F7F4 0%,
        #F8F7F4 55%,
        #F0ECD8 68%,
        #E8D8A0 78%,
        rgba(248, 247, 244, 0) 100%
      );
      transform: translateY(0);
    `;
    document.body.appendChild(overlay);

    // Force reflow
    void overlay.offsetHeight;

    // Animate upward — light "drains" toward the nav
    overlay.style.transition = "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)";
    overlay.style.transform = "translateY(-140vh)";

    // Nav absorb glow when sweep reaches the nav area
    setTimeout(() => {
      const glow = document.createElement("div");
      glow.className = "nav-absorb-glow";
      document.body.appendChild(glow);
      setTimeout(() => glow.remove(), 500);
    }, 750);

    // Cleanup
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      setIsAnimating(false);
    }, 950);
  }, [setIsAnimating]);

  const runDarkToLight = useCallback(() => {
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Make the actual nav bar flicker like a tubelight
    const nav = document.querySelector("nav");
    if (nav) nav.classList.add("nav-flicker-active");

    // Subtle glow spill below the nav
    const glow = document.createElement("div");
    glow.className = "tubelight-glow";
    document.body.appendChild(glow);

    // Spawn fly particles near the nav
    const flyContainer = document.createElement("div");
    flyContainer.className = "fly-container";
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        const fly = document.createElement("div");
        fly.className = "fly-particle";
        fly.style.left = `${30 + Math.random() * 40}%`;
        fly.style.animationDelay = `${Math.random() * 0.5}s`;
        fly.style.animationDuration = `${1.8 + Math.random() * 0.7}s`;
        flyContainer.appendChild(fly);
      }
      document.body.appendChild(flyContainer);
    }, 100);

    // At 800ms: tubelight "catches", toggle theme, sweep dark overlay down
    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", "light");
      if (nav) nav.classList.remove("nav-flicker-active");
      glow.remove();

      const navH = window.innerWidth <= 640 ? 60 : 65;

      // Dark overlay starting just below nav, with warm glow at top edge
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: ${navH}px;
        left: 0;
        width: 100vw;
        height: 140vh;
        z-index: 45;
        pointer-events: none;
        will-change: transform;
        background: linear-gradient(
          to bottom,
          rgba(26, 25, 24, 0) 0%,
          #4A3D20 10%,
          #1A1918 28%,
          #1A1918 100%
        );
        transform: translateY(0);
      `;
      document.body.appendChild(overlay);

      // Force reflow
      void overlay.offsetHeight;

      // Animate downward — light "floods" from nav
      overlay.style.transition = "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)";
      overlay.style.transform = "translateY(140vh)";

      // Cleanup overlay
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        setIsAnimating(false);
      }, 920);
    }, 800);

    // Remove fly particles (they fade out on their own via CSS animation)
    setTimeout(() => {
      if (flyContainer.parentNode) flyContainer.remove();
    }, 2500);
  }, [setIsAnimating]);

  // Watch for theme changes to trigger animation
  useEffect(() => {
    if (theme !== prevThemeRef.current && isAnimating) {
      if (theme === "dark") {
        runLightToDark();
      } else {
        runDarkToLight();
      }
    }
    prevThemeRef.current = theme;
  }, [theme, isAnimating, runLightToDark, runDarkToLight]);

  return (
    <div style={{ background: "var(--c-bg)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
