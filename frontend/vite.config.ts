import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config
export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === 'development'

  return {
    // GitHub Pages repository path
    base: '/AI-Powered-Personal-Health-Copilot/',

    build: {
      // IMPORTANT:
      // frontend/dist nahi, repository root/dist generate hoga
      outDir: path.resolve(import.meta.dirname, '../dist'),
      emptyOutDir: true,
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },

    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      watch: {
        ignored: [
          '**/.figma/**',
        ],
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  }
})
