import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/albums': 'http://localhost:3001',
      '/appinfo': 'http://localhost:3001',
      '/service': 'http://localhost:3001',
      '/errors': 'http://localhost:3001',
      '/actuator': 'http://localhost:3001'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
});
