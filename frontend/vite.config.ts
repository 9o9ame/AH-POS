import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dedicated local control-plane URL; POS remains on localhost.
    // Explicitly allow only our development hostnames.
    allowedHosts: ['platform.localhost', 'app.localhost'],
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
});
