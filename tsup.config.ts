import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    entry: "src/index.ts",
  },
  shims: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ["esbuild"],
});
