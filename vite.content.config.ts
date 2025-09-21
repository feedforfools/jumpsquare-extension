import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  define: {
    "process.env": {},
  },
  build: {
    emptyOutDir: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/content.ts"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        inlineDynamicImports: true,
        format: "iife",
      },
    },
  },
});
