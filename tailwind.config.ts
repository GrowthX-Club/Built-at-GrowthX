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
        bg: "#F8F7F4",
        surface: "#FFFFFF",
        "surface-warm": "#FAF9F6",
        border: "#E8E5DE",
        "border-light": "#F0EDE6",
        text: "#181710",
        "text-sec": "#6B665B",
        "text-mute": "#A09A8C",
        accent: "#181710",
        "accent-soft": "#EDEADE",
        gold: "#B8962E",
        "gold-soft": "#FDF8EC",
        "gold-border": "#E8D9A0",
        green: "#2D7A3F",
        "green-soft": "#EDF7F0",
        blue: "#2255CC",
        "blue-soft": "#EEF3FF",
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
