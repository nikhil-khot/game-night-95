import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: "./tests/setup.ts",
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
      exclude: ["src/routes/auth.ts"], // Exclude auth.ts from coverage
    },
  },
});
