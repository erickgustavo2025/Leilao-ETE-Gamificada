// ARQUIVO: frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  envDir: '../',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true
      },

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ETE Gamificada',
        short_name: 'ETE Game',
        description: 'Sistema de Gamificação Escolar da ETE',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/assets/etegamificada.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/assets/etegamificada.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        // Nunca tratar isso como "rota SPA"
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/assets\//,
          /^\/uploads\//,
          /^\/socket\.io\//,
        ],

        // Estratégias de cache no SW
        runtimeCaching: [
          // HTML (rotas SPA): sempre tentar rede primeiro
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-pages',
              networkTimeoutSeconds: 3,
            },
          },

          // Uploads: sempre rede (sem cache do SW)
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    })
  ],

  server: {
    host: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app']
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router') || id.includes('@remix-run/router')) return 'vendor-router';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';

          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
