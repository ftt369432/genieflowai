import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react({
        // Enable Fast Refresh for better development experience
        fastRefresh: true,
        // Add babel options for better JSX transformation
        babel: {
          plugins: [
            // Add any babel plugins you need
          ],
          // Improve production builds with automatic runtime
          babelrc: false,
          configFile: false,
        }
      }),
      envCompatible(),
      // Add visualizer plugin in production to analyze bundle size
      isProd && visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
      },
    },
    css: {
      postcss: './postcss.config.js',
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    },
    server: {
      port: 3000,
      host: true,
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: 'https://api.genieflowai.com',
          changeOrigin: true,
          secure: true
        }
      }
    },
    build: {
      outDir: 'build',
      sourcemap: isProd ? false : true,
      minify: isProd ? 'terser' : false,
      // Target more modern browsers for smaller bundles
      target: 'es2020',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Create optimal chunks for production
            if (id.includes('node_modules')) {
              if (id.includes('react') && !id.includes('react-dom')) return 'vendor-react';
              if (id.includes('react-dom')) return 'vendor-react-dom';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('chart') || id.includes('recharts')) return 'vendor-charts';
              if (id.includes('framer-motion')) return 'vendor-animations';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('lucide')) return 'vendor-icons';
              if (id.includes('jotai')) return 'vendor-state';
              return 'vendor'; // all other dependencies
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      // Improve CSS handling in production
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: [
        'nanoid', 
        'uuid', 
        'axios', 
        'react-router-dom',
        'framer-motion',
        'clsx',
        'date-fns',
        'jotai',
        'lodash.debounce'
      ],
      // Exclude large libraries that don't need optimization
      exclude: ['mammoth', 'pdfjs-dist']
    },
    publicDir: 'public',
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico', '**/*.webp'],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    // Improve caching for better performance
    cacheDir: 'node_modules/.vite',
    // Preview configuration
    preview: {
      port: 3000
    }
  };
});