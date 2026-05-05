import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Mi Finanzas',
        short_name: 'Finanzas',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      workbox: { cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true }
    })
  ],
  build: { outDir: 'dist', sourcemap: false }
});