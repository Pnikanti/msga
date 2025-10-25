import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(process.cwd(), "dist/src"),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "dist/src")
    }
  },
  base: "./",
  server: {
    port: 5173
  }
});
