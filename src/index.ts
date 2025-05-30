/**
 * @stacks/codegen
 * CLI tool for generating type-safe Stacks contract interfaces
 */

export { defineConfig } from "./utils/config.js";
export type {
  StacksConfig,
  ContractSource,
  NetworkName,
} from "./types/config.js";

export type {
  ClarityContract,
  ClarityFunction,
  ClarityType,
  ContractCallParams,
  ReadOnlyCallParams,
} from "@secondlayer/clarity-types";

// Plugin system exports
export type {
  StacksCodegenPlugin,
  PluginFactory,
  PluginOptions,
  UserConfig,
  ResolvedConfig,
  GenerateContext,
  PluginContext,
  Logger,
  PluginUtils,
  GeneratedOutput,
  ProcessedContract,
  ContractConfig,
  OutputType,
} from "./types/plugin.js";

export { PluginManager } from "./core/plugin-manager.js";
