"use client";

import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Synthesized tubelight sound effects for the dark-to-light flicker animation.
 * Uses Web Audio API — no audio files needed.
 */
function playTubelightSounds() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Starter tick — white noise burst through bandpass (~5.5kHz) + metallic ping
    const tick = (time: number, tickGain: number) => {
      const duration = 0.012;
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.02);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 5500;
      bandpass.Q.value = 5;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.value = 6000;
      highShelf.gain.value = 3;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(tickGain, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      source.connect(bandpass);
      bandpass.connect(highShelf);
      highShelf.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(time);
      source.stop(time + duration);

      // Metallic ping — 4kHz sine, 25ms decay (bimetallic strip ring)
      const ping = ctx.createOscillator();
      ping.type = "sine";
      ping.frequency.value = 4000;

      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(tickGain * 0.35, time);
      pingGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

      ping.connect(pingGain);
      pingGain.connect(ctx.destination);

      ping.start(time);
      ping.stop(time + 0.027);
    }

    // Gas discharge buzz — sawtooth 120Hz, short duration
    const buzz = (time: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 120;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 120;
      bandpass.Q.value = 5;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(gain, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration + 0.01);
    }

    // Final catch clink — high-pitched metallic snap when tubelight locks on
    const clink = (time: number) => {
      // Sharp noise transient through high bandpass
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 6500;
      bp.Q.value = 8;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

      noiseSource.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(time);
      noiseSource.stop(time + 0.015);

      // Primary metallic ring — 5kHz
      const ring1 = ctx.createOscillator();
      ring1.type = "sine";
      ring1.frequency.value = 5000;

      const ring1Gain = ctx.createGain();
      ring1Gain.gain.setValueAtTime(0.30, time);
      ring1Gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      ring1.connect(ring1Gain);
      ring1Gain.connect(ctx.destination);

      ring1.start(time);
      ring1.stop(time + 0.065);

      // Harmonic overtone — 7.5kHz for shimmer
      const ring2 = ctx.createOscillator();
      ring2.type = "sine";
      ring2.frequency.value = 7500;

      const ring2Gain = ctx.createGain();
      ring2Gain.gain.setValueAtTime(0.12, time);
      ring2Gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      ring2.connect(ring2Gain);
      ring2Gain.connect(ctx.destination);

      ring2.start(time);
      ring2.stop(time + 0.045);
    }

    // Schedule all sounds — sample-accurate via AudioContext time
    tick(t + 0.032, 0.15);  buzz(t + 0.032, 0.016, 0.08);
    tick(t + 0.112, 0.18);  buzz(t + 0.112, 0.016, 0.10);
    tick(t + 0.240, 0.20);  buzz(t + 0.240, 0.016, 0.12);
    tick(t + 0.320, 0.22);  buzz(t + 0.320, 0.016, 0.15);
    tick(t + 0.480, 0.25);  buzz(t + 0.480, 0.016, 0.18);
    tick(t + 0.544, 0.30);  buzz(t + 0.544, 0.032, 0.22);
    tick(t + 0.624, 0.25);  clink(t + 0.624);

    // Close context after all sounds finish
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // AudioContext may be blocked by browser autoplay policy — fail silently
  }
}

/**
 * Synthesized switch-off sound — a short, dull click for light-to-dark.
 */
function playSwitchOffSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Crisp noise snap — broadband click
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3500;
    bp.Q.value = 1.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.8, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

    source.connect(bp);
    bp.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(t);
    source.stop(t + 0.02);

    // Mechanical thump — switch body resonance
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.value = 400;

    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.5, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    thump.start(t);
    thump.stop(t + 0.045);

    // Higher click overtone — adds presence
    const click = ctx.createOscillator();
    click.type = "sine";
    click.frequency.value = 2500;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.35, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    click.start(t);
    click.stop(t + 0.018);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // AudioContext may be blocked — fail silently
  }
}

/**
 * CanvasFlip — wraps page content and performs a "light source" animation
 * when the theme toggle is triggered. The nav bar acts as a tubelight fixture.
 *
 * Light -> Dark (~950ms): Light retreats into the nav bar via contracting arc
 * Dark -> Light (~1700ms): Tubelight flickers on, then light sweeps down the page
 */
export default function CanvasFlip({ children }: { children: React.ReactNode }) {
  const { theme, isAnimating, setIsAnimating } = useTheme();
  const prevThemeRef = useRef(theme);

  const runLightToDark = useCallback(() => {
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Switch-off click sound
    playSwitchOffSound();

    // Toggle theme immediately — dark content renders under the overlay
    document.documentElement.setAttribute("data-theme", "dark");

    const navH = window.innerWidth <= 640 ? 60 : 65;

    // Light overlay — masks dark content, revealed via contracting arc
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 45;
      pointer-events: none;
      background: #F8F7F4;
    `;
    document.body.appendChild(overlay);

    // Warm glow edge trailing the arc boundary
    const glowEdge = document.createElement("div");
    glowEdge.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 46;
      pointer-events: none;
      background: radial-gradient(ellipse 120% 80% at 50% ${navH}px,
        transparent 0%, rgba(232,216,160,0.2) 48%, rgba(240,236,216,0.1) 52%, transparent 56%);
      opacity: 0;
    `;
    document.body.appendChild(glowEdge);

    // Arc contracts from fully open to closed at nav — light "drains" upward
    const duration = 550;
    const startTime = performance.now();
    const easeInOutCubic = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const t = easeInOutCubic(raw);

      // Start fully open (160%/200%), shrink to 0%
      const hPct = (1 - t) * 160;
      const vPct = (1 - t) * 200;
      // Tighten the soft edge as the ellipse gets smaller so it doesn't linger
      const softStart = 60 + t * 30; // 60% → 90% as ellipse shrinks
      const maskGrad = `radial-gradient(ellipse ${hPct}% ${vPct}% at 50% ${navH}px, #000 0%, #000 ${softStart}%, rgba(0,0,0,0.4) ${softStart + (100 - softStart) * 0.5}%, transparent 100%)`;
      overlay.style.maskImage = maskGrad;
      overlay.style.webkitMaskImage = maskGrad;

      // Glow edge: fade in first third, fade out last two-thirds
      if (raw < 0.3) {
        glowEdge.style.opacity = String(raw / 0.3);
      } else {
        glowEdge.style.opacity = String((1 - raw) / 0.7);
      }
      const glowMask = `radial-gradient(ellipse ${hPct * 1.08}% ${vPct * 1.08}% at 50% ${navH}px, transparent 55%, #000 100%)`;
      glowEdge.style.maskImage = glowMask;
      glowEdge.style.webkitMaskImage = glowMask;

      if (raw < 1) {
        requestAnimationFrame(animate);
      } else {
        overlay.remove();
        glowEdge.remove();

        // Nav absorb glow at the end
        const absorbGlow = document.createElement("div");
        absorbGlow.className = "nav-absorb-glow";
        document.body.appendChild(absorbGlow);
        setTimeout(() => absorbGlow.remove(), 500);

        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        setIsAnimating(false);
      }
    };
    requestAnimationFrame(animate);
  }, [setIsAnimating]);

  const runDarkToLight = useCallback(() => {
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Make the actual nav bar flicker like a tubelight
    const nav = document.querySelector("nav");
    if (nav) nav.classList.add("nav-flicker-active");

    // Synced tubelight sound effects
    playTubelightSounds();

    // Subtle glow spill below the nav
    const glow = document.createElement("div");
    glow.className = "tubelight-glow";
    document.body.appendChild(glow);

    // Page-level ambient flicker (whole room flashes in sync with nav sputter)
    const ambientOverlay = document.createElement("div");
    ambientOverlay.className = "page-flicker-active";
    document.body.appendChild(ambientOverlay);

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

    // At 800ms: tubelight "catches", toggle theme, arc sweep reveals page
    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", "light");
      if (nav) nav.classList.remove("nav-flicker-active");
      glow.remove();
      ambientOverlay.remove();

      const navH = window.innerWidth <= 640 ? 60 : 65;

      // Full-viewport dark overlay — the mask handles the arc reveal
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 45;
        pointer-events: none;
        background: #1A1918;
      `;
      document.body.appendChild(overlay);

      // Warm glow edge that trails the arc boundary
      const glowEdge = document.createElement("div");
      glowEdge.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 46;
        pointer-events: none;
        background: radial-gradient(ellipse 120% 80% at 50% ${navH}px,
          transparent 0%, rgba(255,220,140,0.15) 48%, rgba(255,200,100,0.08) 52%, transparent 56%);
        opacity: 0;
      `;
      document.body.appendChild(glowEdge);

      // Arc sweep via expanding radial mask — easeOutQuart
      const duration = 650;
      const startTime = performance.now();
      const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const raw = Math.min(elapsed / duration, 1);
        const t = easeOutQuart(raw);

        const hPct = t * 160;
        const vPct = t * 200;
        const maskGrad = `radial-gradient(ellipse ${hPct}% ${vPct}% at 50% ${navH}px, transparent 60%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.6) 88%, #000 100%)`;
        overlay.style.maskImage = maskGrad;
        overlay.style.webkitMaskImage = maskGrad;

        // Glow edge: fade in during first half, fade out during second half
        if (raw < 0.5) {
          glowEdge.style.opacity = String(raw * 2);
        } else {
          glowEdge.style.opacity = String((1 - raw) * 2);
        }
        // Scale glow edge mask with the sweep
        const glowMask = `radial-gradient(ellipse ${hPct * 1.08}% ${vPct * 1.08}% at 50% ${navH}px, transparent 55%, #000 100%)`;
        glowEdge.style.maskImage = glowMask;
        glowEdge.style.webkitMaskImage = glowMask;

        if (raw < 1) {
          requestAnimationFrame(animate);
        } else {
          overlay.remove();
          glowEdge.remove();
          document.body.style.overflow = "";
          window.scrollTo(0, scrollY);
          setIsAnimating(false);
        }
      };
      requestAnimationFrame(animate);
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
