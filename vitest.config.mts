import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Lesson modules are imported lazily; under a full parallel run the first import can be slow.
    testTimeout: 20000,
    // Half the cores: the full suite with every worker can run this machine short of memory.
    maxWorkers: "50%",
  },
});
