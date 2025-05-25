# @stacks/codegen

CLI tool for generating type-safe contract interfaces for Stacks blockchain applications.

## Features

- 🎯 **Type-safe contract interfaces** - Full TypeScript support with type inference
- ⚛️ **React hooks generation** - Auto-generated hooks for seamless React integration
- 📦 **Multiple sources** - Fetch from deployed contracts or parse local Clarity files
- 🔧 **Simple configuration** - Easy setup with `stacks.config.ts`
- 🚀 **Zero runtime overhead** - Generates plain objects, no heavy dependencies
- 🔄 **Multi-network support** - Different addresses for mainnet/testnet
- 🎨 **Clean output** - Formatted, readable TypeScript code
- 📡 **Generic Stacks hooks** - Built-in hooks for common blockchain operations

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
    path: './src/generated/contracts.ts',
    runtime: 'full', // Required for React hooks
    hooks: {
      enabled: true,
      contracts: './src/generated/hooks.ts',    // Contract-specific hooks
      stacks: './src/generated/stacks.ts',      // Generic blockchain hooks
      include: [                                // Optional: specify which generic hooks to include
        'useAccount',
        'useTransaction',
        'useBlock'
      ]
    }
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
      },
      name: 'daoContract'
    },
    
    // Local Clarity file
    {
      source: './contracts/token.clar',
      name: 'tokenContract'
    }
  ]
}
```

**Multi-network contracts generate separate exports:**

```typescript
// Configuration with network filter
export default defineConfig({
  contracts: [
    {
      address: {
        mainnet: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.dao',
        testnet: 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.dao-test'
      },
      name: 'daoContract'
    }
  ],
  network: 'mainnet' // Only generate mainnet version
})

// Generated output (mainnet only)
export const daoContract = {
  address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'dao',
  // ... mainnet methods
}

// Configuration without network filter
export default defineConfig({
  contracts: [/* same as above */],
  // network not specified - generates all networks
})

// Generated output (all networks)
export const daoContract = {
  address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'dao',
  // ... mainnet methods
}

export const testnetDaoContract = {
  address: 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', 
  contractName: 'dao-test',
  // ... testnet methods (same API, different addresses)
}

// Usage - explicit network selection
import { daoContract, testnetDaoContract } from './contracts'

// Use mainnet
await openContractCall({
  ...daoContract.vote({ proposalId: 1n, support: true })
})

// Use testnet  
await openContractCall({
  ...testnetDaoContract.vote({ proposalId: 1n, support: true })
})
```

### Options

- `output.path` - Where to generate the TypeScript file
- `output.runtime` - `'minimal'` (default) or `'full'`
- `output.hooks` - React hooks configuration (requires `runtime: 'full'`)
  - `enabled` - Whether to generate React hooks
  - `contracts` - Path for contract-specific hooks file
  - `stacks` - Path for generic Stacks hooks file  
  - `include` - Array of generic hooks to include (optional)
- `network` - `'testnet'` (default), `'mainnet'`, `'devnet'`, or `'simnet'`
- `apiKey` - Optional API key for higher rate limits
- `apiUrl` - Optional custom API URL

**Network Behavior:**
- **Multi-network contracts**: If `network` is specified, only that network is generated. If omitted, all defined networks are generated.
- **Single-network contracts**: Uses `network` for API selection, defaults to `testnet`.

**Hooks Configuration:**
- Requires `runtime: 'full'` to be enabled
- Automatically installs required React dependencies
- Generates type-safe hooks for all contract functions
- Includes generic blockchain operation hooks

## Runtime Configurations

The CLI supports two runtime modes that determine what gets generated:

### Minimal Runtime (Default)

The minimal runtime generates clean, self-contained contract methods with no additional dependencies:

```typescript
export const nftContract = {
  address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
  contractName: 'nft-nyc',
  
  transfer(id: bigint, sender: string, recipient: string) {
    return {
      contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      contractName: 'nft-nyc',
      functionName: 'transfer',
      functionArgs: [Cl.uint(id), Cl.standardPrincipal(sender), Cl.standardPrincipal(recipient)]
    }
  }
} as const
```

**Benefits:**
- ✅ Zero runtime overhead
- ✅ Perfect tree-shaking
- ✅ No additional dependencies
- ✅ Smallest possible bundle size
- ✅ Works with any framework

### Full Runtime (Enhanced)

The full runtime includes additional helper functions and utilities:

```typescript
export const nftContract = {
  // Basic methods (same as minimal)
  transfer(id: bigint, sender: string, recipient: string) { /* ... */ },
  
  // Read-only helpers with automatic network handling
  read: {
    async getOwner(args: { id: bigint }, options?: { 
      network?: 'mainnet' | 'testnet' | 'devnet';
      senderAddress?: string;
    }) {
      return await fetchCallReadOnlyFunction({
        contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
        contractName: 'nft-nyc',
        functionName: 'get-owner',
        functionArgs: [Cl.uint(args.id)],
        network: options?.network || 'mainnet',
        senderAddress: options?.senderAddress || 'SP000000000000000000002Q6VF78'
      })
    }
  },
  
  // Write helpers with transaction building
  write: {
    async transfer(args: { id: bigint; sender: string; recipient: string }, options: {
      senderKey: string;
      network?: 'mainnet' | 'testnet' | 'devnet';
      fee?: string | number;
      nonce?: bigint;
    }) {
      return await makeContractCall({
        contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
        contractName: 'nft-nyc',
        functionName: 'transfer',
        functionArgs: [Cl.uint(args.id), Cl.standardPrincipal(args.sender), Cl.standardPrincipal(args.recipient)],
        senderKey: options.senderKey,
        network: options.network || 'mainnet',
        ...options
      })
    }
  }
} as const
```

**Full Runtime Features:**
- ✅ Built-in read-only function helpers
- ✅ Transaction building utilities  
- ✅ Network configuration handling
- ✅ React hooks generation (when React is detected)
- ✅ Automatic dependency management
- ✅ Enhanced error handling
- ✅ Type-safe API wrappers

### Configuration

```typescript
export default defineConfig({
  contracts: [/* ... */],
  output: {
    path: './src/contracts.ts',
    runtime: 'minimal', // or 'full'
    hooks: {
      enabled: true,
      contracts: './src/generated/hooks.ts',
      stacks: './src/generated/stacks.ts',
      include: ['useAccount', 'useTransaction', 'useBlock'] // Optional
    }
  }
})
```

**When to use each:**
- **Minimal**: Production apps, libraries, when bundle size matters
- **Full**: Rapid prototyping, internal tools, when developer experience is prioritized, React applications

**React Hooks Requirements:**
- Must use `runtime: 'full'`
- Requires React project with package.json
- Dependencies are automatically installed

## React Hooks Integration

@stacks/codegen can generate React hooks for seamless integration with React applications. This feature requires the full runtime mode and automatically installs necessary dependencies.

### Configuration

Enable React hooks in your `stacks.config.ts`:

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
    path: './src/generated/contracts.ts',
    runtime: 'full', // Required for React hooks
    hooks: {
      enabled: true,
      contracts: './src/generated/hooks.ts',    // Contract-specific hooks
      stacks: './src/generated/stacks.ts',      // Generic blockchain hooks
      include: [                                // Optional: specify which generic hooks to include
        'useAccount',
        'useTransaction',
        'useBlock'
      ]
    }
  }
})
```

### Generated Contract Hooks

For each contract function, the CLI generates corresponding React hooks:

```typescript
// Generated hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { nftContract } from './contracts'

// Read-only function hooks
export function useNftContractGetOwner(id: bigint, options?: { enabled?: boolean }) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['get-owner', nftContract.address, id],
    queryFn: () => nftContract.read.getOwner({ id }, { 
      network: config.network,
      senderAddress: config.senderAddress 
    }),
    enabled: id !== undefined && (options?.enabled ?? true),
    ...options
  })
}

// Public function hooks
export function useNftContractTransfer() {
  return useMutation({
    mutationFn: (args: { id: bigint; sender: string; recipient: string }) =>
      new Promise((resolve, reject) => {
        openContractCall({
          ...nftContract.transfer(args),
          onFinish: resolve,
          onCancel: () => reject(new Error('User cancelled transaction'))
        })
      })
  })
}
```

### Generic Stacks Hooks

The CLI also generates hooks for common blockchain operations:

```typescript
// Generated stacks.ts
export function useAccount(address?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['account', address, config.network],
    queryFn: () => fetchAccountInfo({
      address: address!,
      network: config.network
    }),
    enabled: !!address
  })
}

export function useTransaction(txId?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['transaction', txId, config.network],
    queryFn: () => fetchTransaction({
      txId: txId!,
      network: config.network
    }),
    enabled: !!txId
  })
}

export function useBlock(height?: number) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['block', height, config.network],
    queryFn: () => fetchBlock({
      height: height!,
      network: config.network
    }),
    enabled: typeof height === 'number'
  })
}

export function useAccountTransactions(address?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['account-transactions', address, config.network],
    queryFn: () => fetchAccountTransactions({
      address: address!,
      network: config.network
    }),
    enabled: !!address
  })
}
```

**Available Generic Hooks:**
- `useAccount` - Fetch account information and balances
- `useTransaction` - Get transaction details and status
- `useBlock` - Retrieve block information by height
- `useAccountTransactions` - Get transaction history for an account
- `useWaitForTransaction` - Wait for transaction confirmation (coming soon)

You can specify which hooks to include in your configuration:

```typescript
export default defineConfig({
  // ...
  output: {
    hooks: {
      enabled: true,
      stacks: './src/generated/stacks.ts',
      include: ['useAccount', 'useTransaction'] // Only generate these hooks
    }
  }
})
```

### React Provider Setup

The CLI generates a provider component for configuration:

```typescript
// Generated provider.ts
import { StacksQueryProvider, createStacksConfig } from './provider'

function App() {
  const config = createStacksConfig({
    network: 'mainnet',
    senderAddress: 'SP...' // Optional default sender for read-only calls
  })

  return (
    <StacksQueryProvider config={config}>
      <YourApp />
    </StacksQueryProvider>
  )
}
```

### Usage in Components

```typescript
import { useNftContractGetOwner, useNftContractTransfer } from './generated/hooks'
import { useAccount } from './generated/stacks'

function NFTComponent({ tokenId }: { tokenId: bigint }) {
  // Get token owner
  const { data: owner, isLoading } = useNftContractGetOwner(tokenId)
  
  // Transfer mutation
  const transferMutation = useNftContractTransfer()
  
  // Get current user account
  const { data: account } = useAccount('SP...')

  const handleTransfer = () => {
    transferMutation.mutate({
      id: tokenId,
      sender: 'SP...',
      recipient: 'SP...'
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <p>Owner: {owner}</p>
      <button onClick={handleTransfer}>Transfer NFT</button>
    </div>
  )
}
```

### Dependencies

When hooks are enabled, the CLI automatically installs required dependencies:

- `react`
- `@tanstack/react-query`
- `@stacks/transactions`
- `@stacks/connect`
- `@types/react` (dev dependency)

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
import { makeContractCall } from '@stacks/transactions'
import { defiProtocol } from './generated/contracts'

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

#### React Integration (Full Runtime + Hooks)
```typescript
import { useNftContractGetOwner, useNftContractTransfer } from './generated/hooks'
import { useAccount } from './generated/stacks'

// ✅ Type-safe React hooks with automatic state management
function NFTComponent({ tokenId }: { tokenId: bigint }) {
  // Automatic caching, loading states, and error handling
  const { data: owner, isLoading, error } = useNftContractGetOwner(tokenId)
  
  // Mutation with built-in transaction handling
  const transferMutation = useNftContractTransfer()
  
  // Generic blockchain hooks
  const { data: account } = useAccount('SP...')

  const handleTransfer = () => {
    transferMutation.mutate({
      id: tokenId,
      sender: 'SP...',
      recipient: 'SP...'
    })
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <p>Owner: {owner}</p>
      <button 
        onClick={handleTransfer}
        disabled={transferMutation.isPending}
      >
        {transferMutation.isPending ? 'Transferring...' : 'Transfer NFT'}
      </button>
    </div>
  )
}
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
| ❌ No React integration | ✅ Generated React hooks |
| ❌ Manual state management | ✅ Built-in caching & loading states |
| ❌ Complex error handling | ✅ Automatic error boundaries |

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

### React Hooks Dependencies
When React hooks are enabled, the CLI automatically installs required dependencies. If you encounter issues:

1. **Ensure you have a `package.json`** in your project root
2. **Check your package manager** - The CLI supports npm, yarn, pnpm, and bun
3. **Manual installation** - If automatic installation fails, install dependencies manually:

```bash
npm install react @tanstack/react-query @stacks/transactions @stacks/connect
npm install -D @types/react
```

4. **Provider setup** - Make sure to wrap your app with the generated provider:

```typescript
import { StacksQueryProvider, createStacksConfig } from './generated/provider'

function App() {
  const config = createStacksConfig({
    network: 'mainnet'
  })

  return (
    <StacksQueryProvider config={config}>
      <YourApp />
    </StacksQueryProvider>
  )
}
```

## License

MIT