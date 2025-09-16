import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  define: {
    "process.env": {},
  },
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/content.ts"),
        background: resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        chunkFileNames: "assets/chunk-[hash].js",
        entryFileNames: "assets/[name].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
