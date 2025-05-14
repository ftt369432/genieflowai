import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';
import checker from 'vite-plugin-checker'; // Import the checker plugin

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Access environment variables
  // const env = loadEnv(mode, process.cwd(), ''); // If you need to load .env files here
  // console.log('[vite.config.js] Mode:', mode);
  // console.log('[vite.config.js] VITE_USE_MOCK from process.env:', process.env.VITE_USE_MOCK);
  // console.log('[vite.config.js] All process.env.VITE_ variables:', Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))));


  return {
    plugins: [
      react(),
      svgr(),
      envCompatible({
        prefix: 'VITE_', // Ensure this matches your environment variable prefix if different from default REACT_APP_
        mountedPath: 'process.env', // Default is 'process.env'
      }),
      checker({
        typescript: true, // Enable TypeScript checking
        eslint: {
          // ESLint specific options
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // Command to run ESLint
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // You might also need COEP if you encounter issues with other APIs or SharedArrayBuffer
        // 'Cross-Origin-Embedder-Policy': 'require-corp', // or 'unsafe-none'
      },
    },
    build: {
      sourcemap: true, // Enable source maps for production builds
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Example: Bundle all @mui modules into a single vendor-mui chunk
              if (id.includes('@mui')) {
                return 'vendor-mui';
              }
              // Example: Bundle react and react-dom into vendor-react
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Generic vendor chunk for other node_modules
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      // Vite does not polyfill process.env by default for client-side code.
      // envCompatible plugin handles this. If you still need specific global constants:
      // 'process.env.NODE_ENV': JSON.stringify(mode),
      // 'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
      // 'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
