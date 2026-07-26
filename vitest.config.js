import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Nur die Komponenten-Rauchtests (.test.jsx) laufen hier.
// Die reinen Logiktests sind eigenständige Node-Skripte (*.test.mjs) und
// werden weiterhin direkt mit `node` ausgeführt — sie dürfen NICHT von
// Vitest eingesammelt werden (sie rufen process.exit auf).
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/**/*.test.jsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    restoreMocks: true,
  },
});
