import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Subpath must be listed before the package root (more specific first).
      {
        find: "@multisystem/ui/styles",
        replacement: path.resolve(
          __dirname,
          "../../packages/component-library/src/styles/main.scss",
        ),
      },
      {
        find: "@multisystem/ui",
        replacement: path.resolve(
          __dirname,
          "../../packages/component-library/src/index.ts",
        ),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
