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
    port: 3000,
    // You typically don't need server.proxy when using @cloudflare/vite-plugin,
    // as it handles routing requests to the wrangler dev server running in the background.
    // If your Worker API routes are e.g., /api/entries, you would just fetch from '/api/entries'
    // in your React app, and the plugin will route it.
    // If you explicitly need to proxy to a separate, already running worker instance,
    // you might keep this, but for the integrated setup, it's usually not necessary.
    // For now, I'm commenting it out or removing it for simplicity and typical integration.
    // proxy: {
    //   '/entries': 'http://localhost:8787',
    //   '/community-entries': 'http://localhost:8787',
    // },
  },
  build: {
    // This is CRUCIAL: Tell Vite to build your React app into the 'dist' folder
    // of your *Worker project*.
    // Assuming 'my-react-frontend' and 'find-your-strengths-worker' are sibling directories.
    outDir: '../find-your-strengths-worker/dist',
    emptyOutDir: true, // Clears the output directory before building
  },
})