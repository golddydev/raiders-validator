import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // "@ts-ignore"
  plugins: [tsconfigPaths()],
  test: {
    pool: "forks",
    reporters: "verbose",
    include: [
      "./src/tests/**/parameter-mint.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    testTimeout: 420_000,
    bail: 3,
  },
});
