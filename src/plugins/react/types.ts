/**
 * React Plugin Types for @stacks/codegen
 */

import type { PluginOptions } from "../../types/plugin.js";

/**
 * React plugin configuration options
 */
export interface ReactPluginOptions extends PluginOptions {
  /**
   * Hooks to exclude from generation (both generic and contract-specific)
   * By default, all hooks are generated
   */
  exclude?: string[];
}

/**
 * React-specific configuration types for the provider
 */
export interface StacksReactConfig {
  /**
   * Network to use for API calls
   */
  network: "mainnet" | "testnet" | "devnet";

  /**
   * API key for Stacks API (optional)
   */
  apiKey?: string;

  /**
   * Base URL for Stacks API (optional override)
   */
  apiUrl?: string;

  /**
   * Default sender address for read-only calls
   */
  senderAddress?: string;
}

/**
 * Provider component props
 */
export interface StacksProviderProps {
  children: React.ReactNode;
  config: StacksReactConfig;
}
