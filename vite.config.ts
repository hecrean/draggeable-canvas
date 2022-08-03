import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import tsConfigPath from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), tsConfigPath()],
  base: "./",
  server: {
    host: true,
  },
});
