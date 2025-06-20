import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './packages/react',
  build: {
    outDir: '../../dist-dev',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'packages/react/index.html')
      }
    }
  },
  server: {
    port: 3001
  },
  resolve: {
    alias: {
      '@storymark/core': resolve(__dirname, 'packages/core/src'),
      '@storymark/react': resolve(__dirname, 'packages/react/src')
    }
  }
});