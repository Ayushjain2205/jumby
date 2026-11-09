import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'next/link': path.resolve(import.meta.dirname, './src/client/compat/link.tsx'),
      'next/navigation': path.resolve(import.meta.dirname, './src/client/compat/navigation.ts'),
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
