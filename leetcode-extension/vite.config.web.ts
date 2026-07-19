// vite.config.web.ts — Standalone web/Vercel build
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Expose VITE_ prefixed env vars to the frontend
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL || "/api"
      ),
    },
    server: {
      port: 5173,
      proxy: {
        // In dev, proxy /api/* to the local Vercel dev server (port 3000)
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist-web",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
      },
    },
  };
});
