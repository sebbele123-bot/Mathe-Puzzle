import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLEFILE=1 baut alles (JS/CSS) in eine einzige index.html — z. B. um sie
// als eigenständige, offline lauffähige Seite zu veröffentlichen.
const single = process.env.SINGLEFILE === "1";

export default defineConfig({
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: single ? { outDir: "dist-single", cssCodeSplit: false, assetsInlineLimit: 100000000 } : {},
});
