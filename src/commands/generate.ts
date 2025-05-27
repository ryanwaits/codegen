import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../utils/config.js";
import { StacksApiClient } from "../utils/api.js";
import { parseClarityFile, parseApiResponse } from "../parsers/clarity.js";
import { generateContractInterface } from "../generators/contract.js";
import { PluginManager } from "../core/plugin-manager.js";
import type {
  ResolvedContract,
  NetworkName,
  ContractSource,
} from "../types/config.js";
import type {
  ResolvedConfig,
  ProcessedContract,
  ContractConfig,
} from "../types/plugin.js";

/**
 * Generate command implementation
 */

export interface GenerateOptions {
  config?: string;
  watch?: boolean;
}

export async function generate(options: GenerateOptions) {
  const spinner = ora("Processing contracts").start();

  try {
    const config = await loadConfig(options.config);

    // Get plugin manager from config loading
    const pluginManager = new PluginManager();

    // Register plugins from config
    if (config.plugins) {
      for (const plugin of config.plugins) {
        pluginManager.register(plugin);
      }
    }

    // Execute configResolved hooks
    await pluginManager.executeHook("configResolved", config);

    // Convert existing contracts to ContractConfig format (if any)
    // Use the resolved config which includes contracts added by plugins
    const contractConfigs: ContractConfig[] = (config.contracts || []).map(
      (contract) => ({
        name: contract.name,
        address: contract.address,
        source: contract.source,
        abi: (contract as any).abi, // Include ABI if it exists (from plugins)
        _clarinetSource: (contract as any)._clarinetSource, // Include plugin flags
      })
    );

    // Transform contracts through plugins (plugins can add more contracts)
    const processedContracts = await pluginManager.transformContracts(
      contractConfigs,
      config
    );

    if (processedContracts.length === 0) {
      spinner.warn("No contracts found to generate");
      console.log("\nTo get started:");
      console.log("  • Add contracts to your config file, or");
      console.log("  • Use plugins like clarinet() for local contracts");
      return;
    }

    // Execute generation through plugin system
    const outputs = await pluginManager.executeGeneration(
      processedContracts,
      config
    );

    // If no plugins generated the main contracts output, generate it using the existing generator
    if (!outputs.has("contracts") && processedContracts.length > 0) {
      const contractsCode = await generateContractInterface(processedContracts);
      outputs.set("contracts", {
        path: config.out,
        content: contractsCode,
        type: "contracts",
      });
    }

    // Transform outputs through plugins
    const transformedOutputs = await pluginManager.transformOutputs(outputs);

    // Write all outputs to disk
    await pluginManager.writeOutputs(transformedOutputs);

    const contractCount = processedContracts.length;
    const contractWord = contractCount === 1 ? "contract" : "contracts";
    spinner.succeed(`Generation complete for ${contractCount} ${contractWord}`);

    console.log(`\n📄 ${config.out}`);
    console.log(`\n💡 Import your contracts:`);

    // Show import examples based on actual contract names
    if (processedContracts.length > 0) {
      const exampleContract = processedContracts[0];
      console.log(
        chalk.gray(
          `   import { ${exampleContract.name} } from '${config.out.replace(/\.ts$/, "")}'`
        )
      );

      if (processedContracts.length > 1) {
        console.log(
          chalk.gray(
            `   // Also available: ${processedContracts
              .slice(1)
              .map((c) => c.name)
              .join(", ")}`
          )
        );
      }
    }
  } catch (error: any) {
    spinner.fail("Generation failed");
    console.error(chalk.red(`\n${error.message}`));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Keep existing contract resolution functions for backward compatibility and plugin use
export async function resolveContract(
  source: ContractSource,
  network: NetworkName,
  apiKey?: string,
  apiUrl?: string
): Promise<ResolvedContract> {
  // Handle local source files
  if (source.source) {
    const filePath = path.resolve(process.cwd(), source.source);
    const abi = await parseClarityFile(filePath);

    const name =
      source.name ||
      path
        .basename(source.source, ".clar")
        .replace(/-/g, "_")
        .replace(/^\d/, "_$&");

    // For local files, we need to construct the address
    const address =
      typeof source.address === "string"
        ? source.address
        : source.address?.[network] ||
          "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

    const [contractAddress, contractName] = address.includes(".")
      ? address.split(".")
      : [address, name];

    return {
      name,
      address: contractAddress,
      contractName: contractName || name,
      abi,
      source: "local",
    };
  }

  // Handle deployed contracts
  if (source.address) {
    const contractId =
      typeof source.address === "string"
        ? source.address
        : source.address[network];

    if (!contractId) {
      throw new Error(`No contract address for network ${network}`);
    }

    const contractInfo = await new StacksApiClient(
      network,
      apiKey,
      apiUrl
    ).getContractInfo(contractId);
    const abi = parseApiResponse(contractInfo);

    const [contractAddress, contractName] = contractId.split(".");
    const name =
      source.name || contractName.replace(/-/g, "_").replace(/^\d/, "_$&");

    return {
      name,
      address: contractAddress,
      contractName,
      abi,
      source: "api",
    };
  }

  throw new Error("Contract must have either address or source");
}

export async function resolveContracts(
  source: ContractSource,
  defaultNetwork: NetworkName | undefined,
  apiKey?: string,
  apiUrl?: string
): Promise<ResolvedContract[]> {
  // Handle single network contracts (existing behavior)
  if (typeof source.address === "string" || source.source) {
    const resolved = await resolveContract(
      source,
      defaultNetwork || "testnet", // Use testnet as fallback for single contracts
      apiKey,
      apiUrl
    );
    return [resolved];
  }

  // Handle multi-network contracts
  if (source.address && typeof source.address === "object") {
    const resolvedContracts: ResolvedContract[] = [];

    // If defaultNetwork is specified, only generate that network
    // If no network specified, generate all networks defined in the address object
    const networksToGenerate = defaultNetwork
      ? [defaultNetwork].filter(
          (net) => (source.address as Partial<Record<NetworkName, string>>)[net]
        ) // Only if address exists for that network
      : (Object.keys(source.address) as NetworkName[]);

    for (const network of networksToGenerate) {
      const contractId = source.address[network];
      if (!contractId) continue;

      try {
        const networkApiClient = new StacksApiClient(network, apiKey, apiUrl);

        const contractInfo = await networkApiClient.getContractInfo(contractId);
        const abi = parseApiResponse(contractInfo);

        const [contractAddress, contractName] = contractId.split(".");
        const baseName =
          source.name || contractName.replace(/-/g, "_").replace(/^\d/, "_$&");

        // Generate network-specific names
        const name =
          network === "mainnet"
            ? baseName
            : `${network}${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`;

        resolvedContracts.push({
          name,
          address: contractAddress,
          contractName,
          abi,
          source: "api",
        });
      } catch (error: any) {
        console.warn(
          `Warning: Failed to resolve contract for ${network}: ${error.message}`
        );
      }
    }

    return resolvedContracts;
  }

  throw new Error("Contract must have either address or source");
}
