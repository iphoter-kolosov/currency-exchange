import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        admin: 'admin.html',
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Currency',
        short_name: 'Currency',
        description: 'Live currency converter with historical charts',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Don't precache the SEO pair pages (1800+ files / ~23 MB) or the
        // admin Mini App — both have their own update lifecycle and the
        // calculator's SW shouldn't try to manage them.
        globIgnores: ['pair/**/*', 'admin.html', 'sitemap.xml', 'robots.txt'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/currency-exchange\/pair\//, /^\/currency-exchange\/admin\.html$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jsdelivr-rates',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/[^/]*currency-api\.pages\.dev\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pages-dev-rates',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
