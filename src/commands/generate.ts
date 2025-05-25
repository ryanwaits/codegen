import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../utils/config.js";
import { StacksApiClient } from "../utils/api.js";
import { parseClarityFile, parseApiResponse } from "../parsers/clarity.js";
import { generateContractInterface } from "../generators/contract.js";
import {
  generateContractHooks,
  generateGenericHooks,
} from "../generators/hooks.js";
import { generateReactProvider } from "../generators/react-provider.js";
import { generateStacksApiUtils } from "../generators/stacks-api-generator.js";
import { ensureHooksDependencies } from "../utils/dependencies.js";
import type {
  ResolvedContract,
  NetworkName,
  ContractSource,
} from "../types/config.js";

/**
 * Generate command implementation
 */

export interface GenerateOptions {
  config?: string;
  watch?: boolean;
}

export async function generate(options: GenerateOptions) {
  const spinner = ora("Loading configuration").start();

  try {
    const config = await loadConfig(options.config);
    spinner.succeed("Configuration loaded");

    spinner.start("Resolving contracts");
    const resolvedContracts: ResolvedContract[] = [];

    for (const contract of config.contracts) {
      try {
        const resolved = await resolveContracts(
          contract,
          config.network,
          config.apiKey,
          config.apiUrl
        );
        resolvedContracts.push(...resolved);
        const contractNames = resolved.map((r) => r.name).join(", ");
        spinner.text = `Resolved ${contractNames}`;
      } catch (error: any) {
        spinner.fail(`Failed to resolve contract: ${error.message}`);
        throw error;
      }
    }

    spinner.succeed(`Resolved ${resolvedContracts.length} contracts`);

    spinner.start("Generating TypeScript code");
    const code = await generateContractInterface(
      resolvedContracts,
      config.output.runtime || "minimal"
    );

    const outputPath = path.resolve(process.cwd(), config.output.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(outputPath, code);
    spinner.succeed(`Generated ${outputPath}`);

    if (config.output.hooks?.enabled) {
      await generateHooksFiles(resolvedContracts, config, spinner);
    }

    console.log(
      chalk.green("\n✨ Successfully generated contract interfaces!\n")
    );

    console.log("Import and use your contracts:");
    console.log(
      chalk.gray(`  import { contractName } from '${config.output.path}'`)
    );

    if (config.output.hooks?.enabled) {
      console.log("\nGenerated React hooks:");
      console.log(
        chalk.gray(
          `  import { StacksProvider, StacksQueryProvider } from './src/generated/provider'`
        )
      );
      if (config.output.hooks.contracts) {
        console.log(
          chalk.gray(
            `  import { useContractFunction } from '${config.output.hooks.contracts}'`
          )
        );
      }
      if (config.output.hooks.stacks) {
        console.log(
          chalk.gray(
            `  import { useAccount, useTransaction } from '${config.output.hooks.stacks}'`
          )
        );
      }
    }
  } catch (error: any) {
    spinner.fail("Generation failed");
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function generateHooksFiles(
  resolvedContracts: ResolvedContract[],
  config: any,
  spinner: any
) {
  const hooksConfig = config.output.hooks;

  // Ensure required dependencies are installed
  await ensureHooksDependencies(process.cwd());

  // Generate React provider
  spinner.start("Generating React provider");
  const providerCode = await generateReactProvider();
  const providerPath = path.resolve(
    process.cwd(),
    "./src/generated/provider.tsx"
  );

  await fs.mkdir(path.dirname(providerPath), { recursive: true });
  await fs.writeFile(providerPath, providerCode);

  spinner.succeed(`Generated React provider: ${providerPath}`);

  // Generate Stacks API utilities
  spinner.start("Generating Stacks API utilities");
  const stacksApiCode = await generateStacksApiUtils();
  const stacksApiPath = path.resolve(
    process.cwd(),
    "./src/generated/stacks-api.ts"
  );

  await fs.mkdir(path.dirname(stacksApiPath), { recursive: true });
  await fs.writeFile(stacksApiPath, stacksApiCode);

  spinner.succeed(`Generated Stacks API utilities: ${stacksApiPath}`);

  // Generate contract-specific hooks
  if (hooksConfig.contracts) {
    spinner.start("Generating contract hooks");

    // Only generate hooks if runtime is 'full' (required for utils)
    if (config.output.runtime !== "full") {
      spinner.warn(
        "Hooks require runtime: 'full' - skipping contract hooks generation"
      );
    } else {
      const contractHooksCode = await generateContractHooks(resolvedContracts);
      const contractHooksPath = path.resolve(
        process.cwd(),
        hooksConfig.contracts
      );

      await fs.mkdir(path.dirname(contractHooksPath), { recursive: true });
      await fs.writeFile(contractHooksPath, contractHooksCode);

      spinner.succeed(`Generated contract hooks: ${contractHooksPath}`);
    }
  }

  // Generate generic Stacks hooks
  if (hooksConfig.stacks) {
    spinner.start("Generating generic Stacks hooks");

    const genericHooksCode = await generateGenericHooks(hooksConfig.include);
    const genericHooksPath = path.resolve(process.cwd(), hooksConfig.stacks);

    await fs.mkdir(path.dirname(genericHooksPath), { recursive: true });
    await fs.writeFile(genericHooksPath, genericHooksCode);

    spinner.succeed(`Generated generic hooks: ${genericHooksPath}`);
  }
}

async function resolveContract(
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

async function resolveContracts(
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
