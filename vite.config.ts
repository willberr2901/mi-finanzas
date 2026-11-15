import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { APP_VERSION, RELEASE_NOTES, SILENT_UPDATE } from './src/version';

// Publica /version.json con la versión y sus novedades para el aviso de actualización.
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    // robots.txt: la app real se puede encontrar en Google; la de pruebas no.
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: process.env.VITE_APP_ENV === 'pruebas' ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n' });
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION, notes: RELEASE_NOTES, silent: SILENT_UPDATE }) });
  },
});

// App de pruebas (Render: VITE_APP_ENV=pruebas): otro nombre al instalarla, para no confundirla con la real
const TEST = process.env.VITE_APP_ENV === 'pruebas';

// La app de pruebas no tiene la regla de Render "todo va a index.html": se copia index.html en cada ruta
const routeCopies = (): Plugin => ({
  name: 'route-copies',
  closeBundle() {
    if (!TEST) return;
    for (const r of ['finanzas', 'mercado', 'pagos', 'prestamos', 'escaner', 'ajustes', 'historial-facturas', 'legal', 'reportes', 'hogar', 'confianza', 'analisis']) {
      mkdirSync(`dist/${r}`, { recursive: true }); copyFileSync('dist/index.html', `dist/${r}/index.html`);
    }
  },
});

export default defineConfig({
  plugins: [
    react(),
    versionFile(),
    routeCopies(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.svg', 'favicon-32.png'],
      manifest: {
        name: TEST ? 'Mi Finanzas · Pruebas' : 'Mi Finanzas',
        short_name: TEST ? 'MF Pruebas' : 'Finanzas',
        id: '/',
        start_url: '/',
        scope: '/',
        lang: 'es-CO',
        dir: 'ltr',
        description: 'Las finanzas de tu hogar, claras y en orden: gastos, mercado, pagos y préstamos con Kai. Gratis y tus datos se quedan en tu celular.',
        categories: ['finance', 'productivity', 'lifestyle'],
        display_override: ['standalone', 'minimal-ui'] as any,
        launch_handler: { client_mode: 'navigate-existing' } as any,
        prefer_related_applications: false,
        // Atajos al dejar presionado el ícono de la app
        shortcuts: [
          { name: 'Anotar un gasto', short_name: 'Gasto', url: '/?registrar=gasto', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Lista del mercado', short_name: 'Mercado', url: '/mercado', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Préstamos', short_name: 'Préstamos', url: '/prestamos', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Pagos', short_name: 'Pagos', url: '/pagos', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
        ] as any,
        // Capturas que se ven al instalar (y que pide Play Store)
        screenshots: [
          { src: 'screens/inicio.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Inicio con Kai' },
          { src: 'screens/rueda.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Anota en un toque con la rueda de Kai' },
          { src: 'screens/prestamos.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Préstamos con historial' },
          { src: 'screens/escritorio.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'Mi Finanzas en computador' },
        ] as any,
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
        globIgnores: ['**/version.json', '**/ocr/**', '**/screens/**'],
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