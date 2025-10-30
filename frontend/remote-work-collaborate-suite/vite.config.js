// remote-work-collaborate-suite/frontend/remote-work-collaborate-suite/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["quill", "yjs", "y-websocket", "y-quill"],
    esbuildOptions: {
      define: { global: 'globalThis' },
      plugins: [
        NodeGlobalsPolyfillPlugin({ buffer: true }),
        NodeModulesPolyfillPlugin(),
      ],
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  build: {
    rollupOptions: {
      external: ['katex/dist/katex.min.css'],
      output: {
        manualChunks: (id) => {
          // Core dependencies
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') && !id.includes('react-router')) {
              return 'react-core';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router';
            }
            // Editor core
            if (id.includes('quill/core')) {
              return 'editor-core';
            }
            // Editor formats
            if (id.includes('quill/formats')) {
              return 'editor-formats';
            }
            // Editor modules
            if (id.includes('quill/modules')) {
              return 'editor-modules';
            }
            // Collaboration core
            if (id.includes('yjs/dist')) {
              return 'collab-core';
            }
            // Collaboration providers
            if (id.includes('y-websocket') || id.includes('y-quill')) {
              return 'collab-providers';
            }
            // Math rendering
            if (id.includes('katex')) {
              return 'math';
            }
            // Canvas utilities
            if (id.includes('html2canvas')) {
              return 'canvas';
            }
            // Security
            if (id.includes('dompurify')) {
              return 'security';
            }
            // Split remaining deps by first character to avoid large chunks
            const pkg = id.split('node_modules/')[1].split('/')[0];
            return `vendor-${pkg.charAt(0)}`;
          }
          
          // Application code
          if (id.includes('/src/')) {
            // Components by feature
            if (id.includes('/components/')) {
              if (id.includes('Editor')) return 'feature-editor';
              if (id.includes('Whiteboard')) return 'feature-whiteboard';
              if (id.includes('Chat')) return 'feature-chat';
              if (id.includes('Video')) return 'feature-video';
              return 'components-shared';
            }
            // Pages by route
            if (id.includes('/pages/')) {
              const page = id.split('/pages/')[1].split('.')[0].toLowerCase();
              return `page-${page}`;
            }
            // Other app code
            if (id.includes('/hooks/')) return 'hooks';
            if (id.includes('/utils/')) return 'utils';
            if (id.includes('/services/')) return 'services';
          }
        },
        experimentalMinChunkSize: 10000, // 10kb minimum chunk size
        experimentalMaxChunkSize: 500000, // 500kb maximum chunk size
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true,
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    sourcemap: false,
    target: 'esnext',
    cssCodeSplit: true,
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/src/assets'
    }
  },
});
