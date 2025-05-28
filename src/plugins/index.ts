/**
 * Plugin exports for @stacks/codegen
 * This will be expanded as plugins are implemented
 */

import type { StacksCodegenPlugin } from "../types/plugin.js";

// Re-export plugin types for convenience
export type {
  StacksCodegenPlugin,
  PluginFactory,
  PluginOptions,
  GenerateContext,
  PluginContext,
  Logger,
  PluginUtils,
} from "../types/plugin.js";

// Plugin utilities
export { PluginManager } from "../core/plugin-manager.js";

// Base plugin options interface
export interface BasePluginOptions {
  /** Include only specific contracts/functions */
  include?: string[];

  /** Exclude specific contracts/functions */
  exclude?: string[];

  /** Enable debug output */
  debug?: boolean;
}

/**
 * Utility function to filter contracts/functions based on include/exclude options
 */
export function filterByOptions<T extends { name: string }>(
  items: T[],
  options: BasePluginOptions = {}
): T[] {
  let filtered = items;

  if (options.include && options.include.length > 0) {
    filtered = filtered.filter((item) =>
      options.include!.some(
        (pattern) =>
          item.name.includes(pattern) || item.name.match(new RegExp(pattern))
      )
    );
  }

  if (options.exclude && options.exclude.length > 0) {
    filtered = filtered.filter(
      (item) =>
        !options.exclude!.some(
          (pattern) =>
            item.name.includes(pattern) || item.name.match(new RegExp(pattern))
        )
    );
  }

  return filtered;
}

/**
 * Utility function to create a simple plugin
 */
export function createPlugin(
  name: string,
  version: string,
  implementation: Partial<StacksCodegenPlugin>
): StacksCodegenPlugin {
  return {
    name,
    version,
    ...implementation,
  };
}

// Plugin exports
export { clarinet, hasClarinetProject } from "./clarinet/index.js";
export type { ClarinetPluginOptions } from "./clarinet/index.js";

export { actions } from "./actions/index.js";
export type { ActionsPluginOptions } from "./actions/index.js";

export { react } from "./react/index.js";
export type { ReactPluginOptions } from "./react/index.js";

export { hiro } from "./hiro/index.js";
export type { HiroPluginOptions } from "./hiro/types.js";
