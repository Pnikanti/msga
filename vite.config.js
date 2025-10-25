import { defineConfig } from 'vite';
import path from 'path';

console.log('Vite config loaded!');

export default defineConfig({
  root: "dist/src",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "dist/src")
    }
  },
  base: "./",
  server: {
    port: 5173
  }
});