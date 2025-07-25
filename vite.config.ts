// vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { cloudflare } from '@cloudflare/vite-plugin'; // <--- IMPORT THIS

export default defineConfig({
  plugins: [
    react(),
    cloudflare(), // <--- ADD THIS PLUGIN
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/auth': 'http://localhost:4000',
    },
  },
  build: {
    // This is CRUCIAL: Tell Vite to build your React app into the 'dist' folder
    // of your *Worker project*.
    // Assuming 'my-react-frontend' and 'find-your-strengths-worker' are sibling directories.
    outDir: '../find-your-strengths-worker/dist',
    emptyOutDir: true, // Clears the output directory before building
  },
})