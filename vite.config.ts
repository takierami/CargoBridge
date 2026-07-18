import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


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
  // Netlify sets NETLIFY=true. Prefer VITE_API_URL in Site settings; do not fail the build
  // so the static site can still deploy before the API host is ready.
  if (process.env.NETLIFY === 'true' && !process.env.VITE_API_URL) {
    console.warn(
      '[CargoBridge] VITE_API_URL is not set on Netlify. ' +
        'Build continues with the local fallback (127.0.0.1) — login will not work until you set ' +
        'VITE_API_URL=https://your-api.example.com/api in Site settings → Environment variables.',
    )
  }

  return {
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3025,
    },
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
