/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Pokémon Master Pokédex',
                short_name: 'Pokédex',
                description: 'Offline-first Pokémon catalog and catch tracker',
                theme_color: '#dc2626',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.startsWith('/api/pokemon');
                        },
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pokedex-api-cache',
                            networkTimeoutSeconds: 3,
                            expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.origin === 'https://pokeapi.co';
                        },
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'pokeapi-cache',
                            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.origin === 'https://raw.githubusercontent.com' && url.pathname.includes('sprites');
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'pokemon-sprites',
                            expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: ['e2e/**', 'src/test/**'],
            thresholds: {
                lines: 90,
                statements: 90,
                functions: 90,
                branches: 85,
            },
        },
    },
});
