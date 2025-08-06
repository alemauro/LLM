import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './src/frontend',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});