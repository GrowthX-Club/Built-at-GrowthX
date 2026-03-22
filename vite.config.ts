import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "next/image": path.resolve(__dirname, "shims/next/image"),
      "next/link": path.resolve(__dirname, "shims/next/link"),
      "next/navigation": path.resolve(__dirname, "shims/next/navigation"),
      "next/dynamic": path.resolve(__dirname, "shims/next/dynamic"),
      "next/font/google": path.resolve(__dirname, "shims/next/font"),
    },
  },
  optimizeDeps: {
    include: ["@mui/material", "@emotion/react", "@emotion/styled"],
  },
  build: {
    target: "es2022",
  },
});
