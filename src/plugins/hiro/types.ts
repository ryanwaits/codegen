/**
 * Hiro Plugin Types for @secondlayer/cli
 */

import type { PluginOptions } from "../../types/plugin.js";

/**
 * Hiro plugin configuration options
 */
export interface HiroPluginOptions extends PluginOptions {
  /**
   * API key for Hiro API (required to avoid rate limiting)
   */
  apiKey: string;

  /**
   * Network to fetch contracts from
   */
  network: "mainnet" | "testnet";

  /**
   * Contract IDs to fetch ABIs for
   * Format: "ADDRESS.CONTRACT_NAME" or just "ADDRESS" for all contracts at that address
   */
  contracts: string[];

  /**
   * Enable debug output
   */
  debug?: boolean;
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  requests: number;
  windowStart: number;
}

/**
 * Contract fetch result
 */
export interface ContractFetchResult {
  success: boolean;
  contractId: string;
  abi?: any;
  error?: string;
}
