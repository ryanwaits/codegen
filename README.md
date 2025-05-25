# @stacks/codegen

CLI tool for generating type-safe contract interfaces for Stacks blockchain applications.

## Features

- 🎯 **Type-safe contract interfaces** - Full TypeScript support with type inference
- 📦 **Multiple sources** - Fetch from deployed contracts or parse local Clarity files
- 🔧 **Simple configuration** - Easy setup with `stacks.config.ts`
- 🚀 **Zero runtime overhead** - Generates plain objects, no heavy dependencies
- 🔄 **Multi-network support** - Different addresses for mainnet/testnet
- 🎨 **Clean output** - Formatted, readable TypeScript code

## Installation

```bash
npm install -D @stacks/codegen
# or
yarn add -D @stacks/codegen
# or
bun add -D @stacks/codegen
```

## Local Development & Testing

If you're developing or testing the CLI locally:

```bash
# Clone and build the project
git clone https://github.com/ryanwaits/codegen.git
cd codegen
bun install
bun run build

# Create a global symlink
npm link

# Or with bun
bun link

# Now you can use it anywhere
cd /path/to/your/project
stacks init
stacks generate
```

To unlink when done:
```bash
npm unlink -g @stacks/codegen
# or
bun unlink @stacks/codegen
```

### Testing with a Local Project

1. **Create a test project**:
```bash
mkdir test-project && cd test-project
npm init -y
```

2. **Link the CLI**:
```bash
npm link @stacks/codegen
```

3. **Initialize and test**:
```bash
npx stacks init
# Edit stacks.config.ts with a real contract
npx stacks generate
```

### Example Test Configuration

Create a `stacks.config.ts` with a real deployed contract:

```typescript
import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    {
      // A real NFT contract on mainnet
      address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
      name: 'sbtcToken'
    }
  ],
  output: {
    path: './src/contracts.ts'
  },
  network: 'mainnet'
})
```

## Quick Start

1. **Initialize configuration**
```bash
npx stacks init
```

2. **Edit `stacks.config.ts`**
```typescript
import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    {
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-nyc',
      name: 'nftContract'
    }
  ],
  output: {
    path: './src/generated/contracts.ts'
  }
})
```

3. **Generate interfaces**
```bash
npx stacks generate
```

4. **Use in your app**
```typescript
import { openContractCall } from '@stacks/connect'
import { nftContract } from './generated/contracts'

// Type-safe contract calls
await openContractCall({
  ...nftContract.transfer({
    id: 1n,
    sender: 'SP...',
    recipient: 'SP...'
  }),
  onFinish: data => console.log(data)
})
```

## Configuration

### Contract Sources

```typescript
{
  contracts: [
    // Deployed contract
    {
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-nyc'
    },
    
    // Multi-network contract
    {
      address: {
        mainnet: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.dao',
        testnet: 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.dao-test'
      }
    },
    
    // Local Clarity file
    {
      source: './contracts/token.clar',
      name: 'tokenContract'
    }
  ]
}
```

### Options

- `output.path` - Where to generate the TypeScript file
- `output.runtime` - `'minimal'` (default) or `'full'`
- `network` - `'mainnet'` (default), `'testnet'`, `'devnet'`, or `'simnet'`
- `apiKey` - Optional API key for higher rate limits
- `apiUrl` - Optional custom API URL

## Generated Code

The CLI generates clean, type-safe contract interfaces:

```typescript
export const nftContract = {
  address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'nft-nyc',
  
  // Public functions return ContractCallParams
  transfer(id: bigint, sender: string, recipient: string) {
    return {
      contractAddress: this.address,
      contractName: this.contractName,
      functionName: 'transfer',
      functionArgs: [id, sender, recipient]
    }
  },
  
  // Also supports object syntax
  transfer(args: { id: bigint; sender: string; recipient: string }) {
    return {
      contractAddress: this.address,
      contractName: this.contractName,
      functionName: 'transfer',
      functionArgs: [args.id, args.sender, args.recipient]
    }
  },
  
  // Read-only functions  
  getOwner(id: bigint) {
    return {
      contractAddress: this.address,
      contractName: this.contractName,
      functionName: 'get-owner',
      functionArgs: [id]
    }
  }
} as const
```

## Before vs After: See the Difference

### Without @stacks/codegen (Manual Approach)

Using raw [@stacks/transactions](https://stacks.js.org/modules/_stacks_transactions) and [@stacks/connect](https://www.npmjs.com/package/@stacks/connect) requires manual ClarityValue conversion and is error-prone:

#### Read-Only Function Call
```typescript
import { fetchCallReadOnlyFunction, Cl } from '@stacks/transactions'

// ❌ Manual, verbose, error-prone
const result = await fetchCallReadOnlyFunction({
  contractAddress: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
  contractName: 'sbtc-token',
  functionName: 'get-balance',
  functionArgs: [
    Cl.standardPrincipal('SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF') // Manual conversion
  ],
  senderAddress: 'SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF',
  network: "mainnet",
})
```

#### Contract Call Transaction
```typescript
import { openContractCall } from '@stacks/connect'
import { Cl } from '@stacks/transactions'

// ❌ Manual, repetitive, no type safety
await openContractCall({
  contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'nft-contract',
  functionName: 'transfer',
  functionArgs: [
    Cl.uint(1),                                                    // Manual conversion
    Cl.standardPrincipal('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'), // Manual conversion  
    Cl.standardPrincipal('SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159')  // Manual conversion
  ],
  onFinish: data => console.log(data)
})
```

#### Multi-Argument Function
```typescript
import { makeContractCall, Cl } from '@stacks/transactions'

// ❌ Complex tuple construction, easy to make mistakes
const transaction = await makeContractCall({
  contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'defi-protocol',
  functionName: 'swap-tokens',
  functionArgs: [
    Cl.tuple({                                    // Manual tuple construction
      'token-in': Cl.contractPrincipal(
        'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
        'token-a'
      ),
      'token-out': Cl.contractPrincipal(
        'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', 
        'token-b'
      ),
      'amount-in': Cl.uint(1000000),
      'min-amount-out': Cl.uint(950000)
    }),
    Cl.standardPrincipal('SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF')
  ],
  senderKey: privateKey,
})
```

### With @stacks/codegen (Generated Approach)

Clean, type-safe, and automatic ClarityValue conversion:

#### Read-Only Function Call
```typescript
import { callReadOnlyFunction } from '@stacks/transactions'
import { sbtcToken } from './generated/contracts'

// ✅ Clean, type-safe, automatic conversion
const result = await callReadOnlyFunction({
  ...sbtcToken.getBalance('SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF'), // Auto-converted!
  senderAddress: 'SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF',
  network: "mainnet",
})

// Or use object syntax for clarity
const result2 = await callReadOnlyFunction({
  ...sbtcToken.getBalance({ who: 'SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF' }),
  senderAddress: 'SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF',
  network: "mainnet",
})
```

#### Contract Call Transaction
```typescript
import { openContractCall } from '@stacks/connect'
import { nftContract } from './generated/contracts'

// ✅ Type-safe, clean, automatic conversion
await openContractCall({
  ...nftContract.transfer(1n, 'SP2PABAF...', 'SP3FGQ8Z...'), // Auto-converted!
  onFinish: data => console.log(data)
})

// Or use object syntax
await openContractCall({
  ...nftContract.transfer({
    id: 1n,
    sender: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
    recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159'
  }),
  onFinish: data => console.log(data)
})
```

#### Multi-Argument Function
```typescript
import { makeContractCall } from '@stacks/transactions'
import { defiProtocol } from './generated/contracts'

// ✅ TypeScript intellisense, automatic conversion, no manual tuple construction
const transaction = await makeContractCall({
  ...defiProtocol.swapTokens({
    tokenIn: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.token-a',
    tokenOut: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.token-b', 
    amountIn: 1000000n,
    minAmountOut: 950000n
  }, 'SP143YHR805B8S834BWJTMZVFR1WP5FFC03WZE4BF'),
  senderKey: privateKey,
})
```

### Key Benefits

| Manual Approach | @stacks/codegen Generated |
|-----------------|----------------------|
| ❌ Manual ClarityValue conversion | ✅ Automatic conversion |
| ❌ No type safety | ✅ Full TypeScript support |
| ❌ Error-prone string literals | ✅ Compile-time validation |
| ❌ No IDE intellisense | ✅ Auto-completion & docs |
| ❌ Verbose boilerplate | ✅ Clean, readable code |
| ❌ Easy to make mistakes | ✅ Type-safe by design |
| ❌ Manual ABI management | ✅ Auto-synced with contracts |

## API Usage

You can also use the CLI programmatically:

```typescript
import { defineConfig, generate } from '@stacks/codegen'

const config = defineConfig({
  contracts: [
    { address: 'SP...' }
  ],
  output: { path: './contracts.ts' }
})

await generate({ config })
```

## Commands

### `stacks init`
Creates a default `stacks.config.ts` file

### `stacks generate`
Generates TypeScript interfaces from your configuration

Options:
- `-c, --config <path>` - Path to config file (default: `stacks.config.ts`)
- `-w, --watch` - Watch for changes (coming soon)

## Troubleshooting

### Rate Limiting
If you're getting rate limited when fetching contracts, add an API key to your config:

```typescript
export default defineConfig({
  // ...
  apiKey: process.env.STACKS_API_KEY
})
```

Get a free API key from [Hiro](https://platform.hiro.so/).

### Contract Not Found
Make sure the contract address includes both the deployer address and contract name:
- ✅ `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-nyc`
- ❌ `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9`

## License

MIT