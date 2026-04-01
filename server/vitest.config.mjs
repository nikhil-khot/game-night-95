import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: "./tests/setup.ts",
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: ["src/routes/auth.ts"], // Exclude auth.ts from coverage
    },
  },
});
