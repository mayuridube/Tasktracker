import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5000, // Frontend port (externally accessible)
    hmr: {
      clientPort: 443 // Fix for Replit environment
    },
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy WebSocket connections to the backend server
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  root: path.resolve(__dirname, './client'),
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true
  }
});
