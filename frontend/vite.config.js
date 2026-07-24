import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api requests to the Express backend during local development
// so the React app can just call fetch('/api/...') without worrying about ports/CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
