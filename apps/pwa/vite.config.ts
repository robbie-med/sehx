import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@sexmetrics/core": fileURLToPath(new URL("../../packages/core/src", import.meta.url)),
      "@sexmetrics/storage": fileURLToPath(new URL("../../packages/storage/src", import.meta.url)),
      "@sexmetrics/analytics": fileURLToPath(new URL("../../packages/analytics/src", import.meta.url)),
      "@sexmetrics/timeline": fileURLToPath(new URL("../../packages/timeline/src", import.meta.url)),
      "@sexmetrics/capture": fileURLToPath(new URL("../../packages/capture/src", import.meta.url)),
      "@sexmetrics/dsp": fileURLToPath(new URL("../../packages/dsp/src", import.meta.url)),
      "@sexmetrics/inference": fileURLToPath(new URL("../../packages/inference/src", import.meta.url)),
      "@sexmetrics/asr": fileURLToPath(new URL("../../packages/asr/src", import.meta.url))
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "SexMetrics",
        short_name: "SexMetrics",
        start_url: ".",
        display: "standalone",
        background_color: "#0b0d12",
        theme_color: "#0b0d12",
        icons: []
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  worker: {
    format: "es"
  }
});
