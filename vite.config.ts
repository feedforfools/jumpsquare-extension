import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'process.env': {}
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/ui/popup.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});