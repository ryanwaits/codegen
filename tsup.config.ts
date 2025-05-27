import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    "plugins/index": "src/plugins/index.ts",
    "core/plugin-manager": "src/core/plugin-manager.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    entry: {
      index: "src/index.ts",
      "plugins/index": "src/plugins/index.ts",
      "core/plugin-manager": "src/core/plugin-manager.ts",
    },
  },
  shims: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ["esbuild", "clarity-abitype"],
});
