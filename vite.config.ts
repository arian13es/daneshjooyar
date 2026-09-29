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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('leaflet')) return 'vendor-leaflet';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react') || id.includes('@heroicons')) return 'vendor-icons';
              if (id.includes('@capacitor')) return 'vendor-capacitor';
              if (id.includes('jalaali-js') || id.includes('react-date-object')) return 'vendor-date';
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
            }
            if (id.includes('campusGisData')) {
              return 'campus-gis-data';
            }
          },
        },
      },
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
        ignored: ['**/android/**', '**/dist/**', '**/releases/**', '**/*.apk', '**/*.tmp*', '**/*.tmpdir/**', '**/.*.tmpdir/**'],
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      globals: false,
    },
  };
});
