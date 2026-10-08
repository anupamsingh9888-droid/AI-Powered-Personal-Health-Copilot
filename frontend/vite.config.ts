import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json' with { type: 'json' }


// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: '/AI-Powered-Personal-Health-Copilot/',

    build: {
      outDir: path.resolve(import.meta.dirname, '../dist'),
      emptyOutDir: true,
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },

    plugins: [
      react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
      cloudsqlApiPlugin(),
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
