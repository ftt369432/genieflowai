import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';
import checker from 'vite-plugin-checker'; // Import the checker plugin
import { visualizer } from 'rollup-plugin-visualizer';

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
      visualizer(),
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
        'Cross-Origin-Embedder-Policy': 'require-corp', // Or 'unsafe-none' if this causes issues
      },
    },
    build: {
      sourcemap: true, // Enable source maps for production builds
      outDir: 'build',
      rollupOptions: {
        external: [
          '@tanstack/react-query',
          '@tanstack/react-query-devtools'
        ],
        output: {
          manualChunks: {
            'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@supabase/supabase-js'
            ]
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
