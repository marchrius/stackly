import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
