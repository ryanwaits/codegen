import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";

/**
 * Init command - creates a default config file
 */

const DEFAULT_CONFIG = `import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    {
      // Fetch from deployed contract
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-nyc',
      name: 'nftContract' // optional alias
    },
    {
      // Or from local Clarity file
      source: './contracts/my-contract.clar',
      name: 'myContract'
    }
  ],
  
  output: {
    path: './src/generated/contracts.ts',
    runtime: 'minimal' // or 'full' for more features
  },

  network: 'mainnet', // or 'testnet', 'devnet', 'simnet'
  
  // Optional: Add your Hiro API key for higher rate limits
  // apiKey: process.env.STACKS_API_KEY
})
`;

export async function init() {
  const configPath = path.join(process.cwd(), "stacks.config.ts");

  // Check if config already exists
  try {
    await fs.access(configPath);
    console.log(chalk.yellow("⚠️  stacks.config.ts already exists"));
    return;
  } catch {
    // File doesn't exist, continue
  }

  // Write config file
  await fs.writeFile(configPath, DEFAULT_CONFIG);

  console.log(chalk.green("✅ Created stacks.config.ts"));
  console.log("\nNext steps:");
  console.log("  1. Edit stacks.config.ts to add your contracts");
  console.log('  2. Run "stacks generate" to generate TypeScript interfaces');
}
