import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  build: {
    target: "es2022", // this affects Rollup build
  },
  esbuild: {
    target: "es2022", // or 'esnext'
  },
});
