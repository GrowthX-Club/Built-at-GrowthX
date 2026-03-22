import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  serverModuleFormat: "esm",
  presets: [vercelPreset()],
} satisfies Config;
