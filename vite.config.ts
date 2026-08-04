import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Production: fail closed — never bake a missing API URL.
  if (mode === 'production' && !process.env.VITE_API_URL?.trim()) {
    throw new Error(
      'VITE_API_URL is required for production builds (e.g. /api for same-origin VPS). ' +
        'Set it at build time (export VITE_API_URL=/api), then rebuild.',
    )
  }

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'CargoBridge',
          short_name: 'CargoBridge',
          description: 'International shipping and supplier management',
          theme_color: '#1e40af',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          lang: 'ar',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      port: 3025,
      host: true,
      strictPort: false,
      // Same-origin /api proxy (browser stays on HTTP localhost → no cert warnings)
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
