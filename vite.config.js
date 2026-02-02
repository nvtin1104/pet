import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        settings: path.resolve(__dirname, 'src/settings/index.html'),
        pet: path.resolve(__dirname, 'src/pet/index.html'),
      },
      output: {
        manualChunks: undefined, // Disable chunking for Electron CSP
      }
    }
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
