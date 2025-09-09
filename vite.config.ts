import { type Plugin } from "vite";
import { type ViteDevServer } from "vite";
import { type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createServer } from "./server";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(
  ({ mode }): UserConfig => ({
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [react(), expressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  }),
);

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server: ViteDevServer): void {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
