import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "");

  return {
    base: mode === "production" ? "/factshield/" : "/",
    plugins: [react()],
    server: { port: 3000, host: "0.0.0.0" },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
