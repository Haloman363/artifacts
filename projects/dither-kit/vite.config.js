import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Served as a sub-app of the artifacts hub on GitHub Pages.
const base = "/artifacts/dither-kit/";

export default defineConfig({
  base,
  worker: { format: "es" },
  // The filter engine is one ~2 MB module; splitting it gains nothing for an offline PWA.
  build: { chunkSizeWarningLimit: 3000 },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dither Kit",
        short_name: "Dither Kit",
        description: "Dithering, glitch and ASCII effects studio for images and video",
        theme_color: "#0b0b0c",
        background_color: "#0b0b0c",
        display: "standalone",
        orientation: "any",
        categories: ["photo", "graphics", "design"],
        scope: base,
        start_url: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        file_handlers: [
          {
            action: base,
            accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"], "video/*": [".mp4", ".webm", ".mov"] },
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,wasm,woff2}"],
        // The filter engine ships large chunks (WASM colour backend, 300+ filters).
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
