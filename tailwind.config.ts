import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        "surface-warm": "var(--c-surfaceWarm)",
        border: "var(--c-border)",
        "border-light": "var(--c-borderLight)",
        text: "var(--c-text)",
        "text-sec": "var(--c-textSec)",
        "text-mute": "var(--c-textMute)",
        accent: "var(--c-accent)",
        "accent-soft": "var(--c-accentSoft)",
        gold: "var(--c-gold)",
        "gold-soft": "var(--c-goldSoft)",
        "gold-border": "var(--c-goldBorder)",
        green: "var(--c-green)",
        "green-soft": "var(--c-greenSoft)",
        blue: "var(--c-blue)",
        "blue-soft": "var(--c-blueSoft)",
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
