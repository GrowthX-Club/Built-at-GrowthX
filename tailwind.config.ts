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
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-warm": "var(--color-surface-warm)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        text: "var(--color-text)",
        "text-sec": "var(--color-text-sec)",
        "text-mute": "var(--color-text-mute)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        gold: "var(--color-gold)",
        "gold-soft": "var(--color-gold-soft)",
        "gold-border": "var(--color-gold-border)",
        green: "var(--color-green)",
        "green-soft": "var(--color-green-soft)",
        blue: "var(--color-blue)",
        "blue-soft": "var(--color-blue-soft)",
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
