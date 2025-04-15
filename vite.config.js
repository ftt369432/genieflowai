import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    envCompatible()
  ],
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
    port: 3000,
    host: true,
    // Prevent internal server errors
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
          https://apis.google.com 
          https://www.gstatic.com 
          https://www.google-analytics.com 
          https://www.googletagmanager.com
          https://tagmanager.google.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: http:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' 
          https://api.genieflowai.com 
          https://*.supabase.co 
          https://generativelanguage.googleapis.com 
          https://www.googleapis.com 
          https://gmail.googleapis.com
          https://oauth2.googleapis.com 
          https://firebaseinstallations.googleapis.com
          https://*.firebase.googleapis.com 
          https://*.firebaseio.com 
          https://identitytoolkit.googleapis.com 
          https://securetoken.googleapis.com 
          https://firebaselogging.googleapis.com
          https://*.googleapis.com
          https://*.google-analytics.com
          https://*.analytics.google.com
          wss://*.firebaseio.com;
        frame-src 'self' https://*.google.com;
        media-src 'self' https: http:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `.replace(/\s+/g, ' ').trim()
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          nanoid: ['nanoid']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['nanoid']
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico']
}); 