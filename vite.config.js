import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
    // Make CSS imports work properly
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  server: {
    port: 3007,
    host: true,
    // Prevent internal server errors
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico']
}); 