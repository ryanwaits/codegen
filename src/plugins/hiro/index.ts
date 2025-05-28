/**
 * Hiro Plugin for @stacks/codegen
 * Fetches contract ABIs from deployed contracts on mainnet/testnet using the Hiro API
 */

import { StacksApiClient } from "../../utils/api.js";
import { parseApiResponse } from "../../parsers/clarity.js";
import type { PluginFactory, UserConfig } from "../../types/plugin.js";
import type { HiroPluginOptions, ContractFetchResult } from "./types.js";

/**
 * Hiro plugin factory
 */
export const hiro: PluginFactory<HiroPluginOptions> = (options) => {
  // Validate required options
  if (!options?.apiKey) {
    throw new Error(
      "Hiro plugin requires an API key. Get one for free at https://platform.hiro.so/"
    );
  }

  if (!options.network) {
    throw new Error("Hiro plugin requires a network ('mainnet' or 'testnet')");
  }

  if (!options.contracts || options.contracts.length === 0) {
    throw new Error(
      "Hiro plugin requires a contracts array with contract IDs to fetch"
    );
  }

  return {
    name: "@stacks/codegen/plugin-hiro",
    version: "1.0.0",

    async transformConfig(config: UserConfig): Promise<UserConfig> {
      if (options.debug) {
        console.log(
          `🔄 Hiro plugin: Fetching ABIs for ${options.contracts.length} contracts from ${options.network}`
        );
      }

      // Create API client
      const apiClient = new StacksApiClient(options.network, options.apiKey);

      // Fetch all contracts
      const fetchedContracts = [];

      for (const contractId of options.contracts) {
        const result = await fetchContractABI(
          contractId,
          apiClient,
          options.debug
        );

        if (result.success && result.abi) {
          const [address, contractName] = contractId.split(".");

          // Generate a clean name for the contract
          const name = contractName
            ? contractName.replace(/-/g, "_").replace(/^\d/, "_$&")
            : address.replace(/^SP|^ST/, "").toLowerCase();

          fetchedContracts.push({
            name,
            address: contractId,
            abi: result.abi,
            metadata: {
              source: "hiro-api",
              network: options.network,
              fetchedAt: new Date().toISOString(),
            },
          });

          if (options.debug) {
            console.log(
              `✅ Hiro plugin: Successfully fetched ABI for ${contractId}`
            );
          }
        } else {
          if (options.debug) {
            console.warn(
              `⚠️  Hiro plugin: Failed to fetch ${contractId}: ${result.error}`
            );
          }
        }
      }

      if (options.debug) {
        console.log(
          `🔍 Hiro plugin: Successfully fetched ${fetchedContracts.length}/${options.contracts.length} contracts`
        );
      }

      return {
        ...config,
        contracts: [...(config.contracts || []), ...fetchedContracts],
      };
    },
  };
};

/**
 * Fetch contract ABI from Hiro API
 */
async function fetchContractABI(
  contractId: string,
  apiClient: StacksApiClient,
  debug?: boolean
): Promise<ContractFetchResult> {
  try {
    if (debug) {
      console.log(`🔄 Fetching ABI for ${contractId}`);
    }

    // Make the API request
    const contractInfo = await apiClient.getContractInfo(contractId);

    // Parse the response using existing parser
    const abi = parseApiResponse(contractInfo);

    return {
      success: true,
      contractId,
      abi,
    };
  } catch (error: any) {
    // Handle specific error types
    if (
      error.message?.includes("Contract not found") ||
      error.response?.statusCode === 404
    ) {
      return {
        success: false,
        contractId,
        error: `Contract not found: ${contractId}`,
      };
    }

    if (
      error.message?.includes("Rate limited") ||
      error.response?.statusCode === 429
    ) {
      return {
        success: false,
        contractId,
        error: `Rate limited when fetching ${contractId}. Consider using an API key.`,
      };
    }

    // Handle other errors
    return {
      success: false,
      contractId,
      error: error.message || "Unknown error",
    };
  }
}
