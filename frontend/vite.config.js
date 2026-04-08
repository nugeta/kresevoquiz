import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',          // modern browsers only, less polyfill bloat
    cssMinify: 'lightningcss', // faster + better CSS minification
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Heavy 3D libs — only needed on auth + landing
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/ogl')) return 'ogl';
          // Charts — only on stats page
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) return 'charts';
          // Animation
          if (id.includes('node_modules/gsap')) return 'gsap';
          // Core React
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router') || id.includes('node_modules/react/')) return 'vendor';
          // UI primitives
          if (id.includes('node_modules/@radix-ui')) return 'ui';
          // Icons — large but shared
          if (id.includes('node_modules/lucide-react')) return 'icons';
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
