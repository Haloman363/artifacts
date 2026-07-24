import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we supply our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,mp3,json}'],
      },
    }),
  ],
})
