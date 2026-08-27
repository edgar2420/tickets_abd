import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';

const { version } = createRequire(import.meta.url)('./package.json');

const haciaLaApi = {
  '/api': { target: 'http://localhost:4000', changeOrigin: true, xfwd: true },
  '/socket.io': { target: 'http://localhost:4000', ws: true, xfwd: true }
};

export default defineConfig({
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(version) },
  server: { host: true, port: 5173, proxy: haciaLaApi },
  preview: { host: true, port: 4173, proxy: haciaLaApi },
  build: { outDir: 'dist', sourcemap: false }
});
