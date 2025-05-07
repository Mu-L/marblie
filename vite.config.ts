import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  esbuild: {
    target: "ES2022", // or 'esnext'
  },
});
