import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { APP_VERSION, RELEASE_NOTES } from './src/version';

// Publica /version.json con la versión y sus novedades para el aviso de actualización.
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION, notes: RELEASE_NOTES }) });
  },
});

export default defineConfig({
  plugins: [
    react(),
    versionFile(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.svg', 'favicon-32.png'],
      manifest: {
        name: 'Mi Finanzas',
        short_name: 'Finanzas',
        description: 'Las finanzas de tu hogar, claras y en orden',
        theme_color: '#0B1026',
        background_color: '#0B1026',
        display: 'standalone',
        // Permite saber si la app ya está instalada cuando la abren desde el navegador (para no ofrecerla otra vez)
        related_applications: [{ platform: 'webapp', url: 'https://mi-finanzas.onrender.com/manifest.webmanifest' }] as any,
        orientation: 'portrait',
        // Mi Finanzas aparece en el menú Compartir de Android para registrar gastos desde notificaciones
        share_target: { action: '/compartir', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } } as any,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      // Service worker propio (src/sw.ts): guarda la app sin internet y revisa pagos en segundo plano.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,mp3}'],
        globIgnores: ['**/version.json', '**/ocr/**'],
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'react-toastify']
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'react-toastify']
  }
});