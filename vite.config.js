import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  return {
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
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('chart') || id.includes('recharts')) return 'vendor-charts';
              if (id.includes('framer-motion')) return 'vendor-animations';
              return 'vendor'; // all other dependencies
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['nanoid', 'uuid', 'axios', 'react-router-dom']
    },
    publicDir: 'public',
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  };
});