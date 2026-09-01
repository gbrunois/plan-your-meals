/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      // Only precache/serve the app shell offline (JS/CSS/HTML/icons).
      // Firestore data is NOT cached here - enabling Firestore's own
      // offline persistence previously crashed the app because
      // `primary_planning`/`own_planning` are DocumentReference fields
      // that can't be structured-cloned into IndexedDB (see CLAUDE.md).
      filename: 'service-worker.js',
      // registerServiceWorker.ts already registers the generated file
      // itself via `register-service-worker`.
      injectRegister: false,
      manifest: false,
      workbox: {
        // Default globPatterns already cover dist/**/*.{js,css,html,...};
        // explicit here so new asset types added later are still cached.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        // Without these, a new service worker sits in "waiting" until every
        // tab for this origin is closed (not just refreshed) - deployed
        // fixes silently don't reach anyone still on an open tab, including
        // during our own testing just now.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  define: {
    'process.env': {},
  },
  test: {
    globals: true,
  },
})
