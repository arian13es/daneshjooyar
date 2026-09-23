import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig(() => {
  return {
    plugins: [react()],
    base: './',
    build: {
      target: ['chrome70', 'es2018'],
      cssTarget: 'chrome70',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
        'motion/react',
        'leaflet',
        'react-date-object',
        'jalaali-js',
        '@capacitor/core'
      ]
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify this file; watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/android/**', '**/dist/**', '**/releases/**', '**/*.apk'],
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      globals: false,
    },
  };
});
