/**
 * Configuration types for @stacks/codegen
 */

export type NetworkName = "mainnet" | "testnet" | "devnet";

export interface ContractSource {
  /**
   * Contract identifier (address.name) for deployed contracts
   */
  address?: string | Partial<Record<NetworkName, string>>;

  /**
   * Path to local Clarity file
   */
  source?: string;

  /**
   * Optional name to use in generated code
   */
  name?: string;
}

export interface OutputConfig {
  /**
   * Output file path
   */
  path: string;

  /**
   * Whether to generate additional runtime helpers
   */
  runtime?: "minimal" | "full";
}

export interface StacksConfig {
  /**
   * Contracts to generate interfaces for
   */
  contracts: ContractSource[];

  /**
   * Output configuration
   */
  output: OutputConfig;

  /**
   * Network to use for fetching contracts
   */
  network?: NetworkName;

  /**
   * API key for Stacks API (if required)
   */
  apiKey?: string;

  /**
   * Base URL for Stacks API (optional override)
   */
  apiUrl?: string;

  /**
   * Whether to use Clarinet.toml if found
   */
  clarinet?: boolean | string;
}

export interface ResolvedContract {
  name: string;
  address: string;
  contractName: string;
  abi: any; // Will be ClarityContract type
  source: "api" | "local";
}

// Helper function type
export type ConfigDefiner = (config: StacksConfig) => StacksConfig;
