import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import { transformSync } from "esbuild";
import type { StacksConfig, ConfigDefiner } from "../types/config.js";

/**
 * Config file utilities
 */

const CONFIG_FILE_NAMES = [
  "stacks.config.ts",
  "stacks.config.js",
  "stacks.config.mjs",
];

export async function findConfigFile(cwd: string): Promise<string | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(cwd, fileName);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // File doesn't exist, continue
    }
  }
  return null;
}

export async function loadConfig(configPath?: string): Promise<StacksConfig> {
  const cwd = process.cwd();

  const resolvedPath = configPath
    ? path.resolve(cwd, configPath)
    : await findConfigFile(cwd);

  if (!resolvedPath) {
    throw new Error(
      "No config file found. Create a stacks.config.ts file or specify a path with --config"
    );
  }

  let config: any;

  if (resolvedPath.endsWith(".ts")) {
    const code = await fs.readFile(resolvedPath, "utf-8");

    // Transform TypeScript to JavaScript, replacing the @stacks/cli import
    // For development/linked packages, we need to resolve to the actual package location
    // This will work both for published packages and local development
    let replacementPath: string;

    try {
      // Try to resolve @stacks/cli as if it were a normal package
      const require = createRequire(import.meta.url);
      const packagePath = require.resolve("@stacks/cli");
      replacementPath = pathToFileURL(packagePath).href;
    } catch {
      // Fallback: resolve relative to current module (for development)
      const currentModuleDir = path.dirname(new URL(import.meta.url).pathname);
      const indexPath = path.resolve(currentModuleDir, "../index.js");
      replacementPath = pathToFileURL(indexPath).href;
    }

    const transformedCode = code.replace(
      /from\s+["']@stacks\/cli["']/g,
      `from '${replacementPath}'`
    );

    const result = transformSync(transformedCode, {
      format: "esm",
      target: "node18",
      loader: "ts",
    });

    const tempPath = resolvedPath.replace(/\.ts$/, ".mjs");
    await fs.writeFile(tempPath, result.code);

    try {
      const fileUrl = pathToFileURL(tempPath).href;
      const module = await import(fileUrl);
      config = module.default;
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  } else {
    const fileUrl = pathToFileURL(resolvedPath).href;
    const module = await import(fileUrl);
    config = module.default;
  }

  if (!config) {
    throw new Error("Config file must export a default configuration");
  }

  if (typeof config === "function") {
    config = config({} as StacksConfig);
  }

  validateConfig(config);

  return config;
}

export function validateConfig(
  config: unknown
): asserts config is StacksConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be an object");
  }

  const c = config as any;

  if (!Array.isArray(c.contracts) || c.contracts.length === 0) {
    throw new Error("Config must have at least one contract");
  }

  if (!c.output || typeof c.output !== "object") {
    throw new Error("Config must have an output configuration");
  }

  if (!c.output.path || typeof c.output.path !== "string") {
    throw new Error("Config output must have a path");
  }

  for (const contract of c.contracts) {
    if (!contract.address && !contract.source) {
      throw new Error("Each contract must have either an address or source");
    }
  }
}

export function defineConfig(config: StacksConfig): StacksConfig;
export function defineConfig(definer: ConfigDefiner): ConfigDefiner;
export function defineConfig(configOrDefiner: StacksConfig | ConfigDefiner) {
  return configOrDefiner;
}
