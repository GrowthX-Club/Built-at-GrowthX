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
        orange: {
          DEFAULT: "#FF6B35",
          50: "#FFF5F0",
          100: "#FFE8DB",
          500: "#FF6B35",
          600: "#E85A25",
        },
        dark: "#1A1F36",
        secondary: "#8899AA",
        border: "#E8ECF0",
        "border-light": "#F0F2F5",
        surface: "#FAFBFC",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
