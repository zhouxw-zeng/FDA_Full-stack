import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/showcase/',
  plugins: [vue()],
  build: {
    outDir: '../web/public/showcase',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
  },
});
