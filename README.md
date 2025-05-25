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
- 🛡️ **SIP-030 compliance** - Full `@stacks/connect` v8 integration

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
        'useConnect',
        'useDisconnect',
        'useNetwork',
        'useContract',
        'useReadContract',
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
        'useConnect',
        'useDisconnect',
        'useNetwork',
        'useContract',
        'useReadContract',
        'useTransaction',
        'useBlock'
      ]
    }
  }
})
```

### Generated Contract Hooks

For each contract function, the CLI generates corresponding React hooks with a clean, developer friendly API:

```typescript
// Generated hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { useContract, useReadContract } from './stacks'
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

// Public function hooks with broadcast API
export function useNftContractTransfer(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const contract = useContract<any, any>(options)
  
  return {
    ...contract,
    broadcast: (args: { id: bigint; sender: string; recipient: string }) => {
      const contractCallData = nftContract.transfer(args)
      contract.broadcast(contractCallData)
    },
    broadcastAsync: async (args: { id: bigint; sender: string; recipient: string }) => {
      const contractCallData = nftContract.transfer(args)
      return contract.broadcastAsync(contractCallData)
    }
  }
}
```

### Generic Stacks Hooks

The CLI generates hooks for common blockchain operations:

#### Connection Management

```typescript
// Generated stacks.ts

// Account management - no parameters needed, returns connection state
export function useAccount() {
  return useQuery({
    queryKey: ['stacks-account', config.network],
    queryFn: async () => {
      const connected = isConnected()
      if (!connected) return { address: undefined, isConnected: false, status: 'disconnected' }
      
      const result = await request('stx_getAddresses') // SIP-030 compliant
      const stxAddresses = result.addresses
        .filter(addr => addr.address.startsWith('SP') || addr.address.startsWith('ST'))
        .map(addr => addr.address)

      return {
        address: stxAddresses[0],
        addresses: stxAddresses,
        isConnected: true,
        status: 'connected'
      }
    }
  })
}

// Connection with optional wallet selection
export function useConnect() {
  return useMutation({
    mutationFn: async (options: { forceWalletSelect?: boolean } = {}) => {
      return await connect(options) // @stacks/connect v8
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stacks-account'] })
    }
  })
}

// Clean disconnection
export function useDisconnect() {
  return useMutation({
    mutationFn: async () => await disconnect(),
    onSuccess: () => queryClient.clear()
  })
}

// Network information
export function useNetwork() {
  return useQuery({
    queryKey: ['stacks-network', config.network],
    queryFn: async () => ({
      network: config.network,
      isMainnet: config.network === 'mainnet',
      isTestnet: config.network === 'testnet',
      isDevnet: config.network === 'devnet'
    })
  })
}
```

#### Contract Interaction

```typescript
// Generic contract interaction hook
export function useContract<TArgs = any, TResult = any>(options?: {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (contractCall: {
      contractAddress: string;
      contractName: string;
      functionName: string;
      functionArgs: any[];
    }) => {
      // Try SIP-030 stx_callContract first, fallback to openContractCall
      try {
        return await request('stx_callContract', {
          contract: `${contractCall.contractAddress}.${contractCall.contractName}`,
          functionName: contractCall.functionName,
          functionArgs: contractCall.functionArgs
        })
      } catch {
        return new Promise((resolve, reject) => {
          openContractCall({
            ...contractCall,
            onFinish: resolve,
            onCancel: () => reject(new Error('User cancelled'))
          })
        })
      }
    }
  })
}

// Generic read contract hook
export function useReadContract<TArgs = any, TResult = any>(params: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  args?: TArgs;
  network?: 'mainnet' | 'testnet' | 'devnet';
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['read-contract', params.contractAddress, params.contractName, params.functionName, params.args],
    queryFn: async () => {
      const { fetchCallReadOnlyFunction } = await import('@stacks/transactions')
      
      return await fetchCallReadOnlyFunction({
        contractAddress: params.contractAddress,
        contractName: params.contractName,
        functionName: params.functionName,
        functionArgs: convertArgsToArray(params.args), // Automatic conversion
        network: params.network || config.network
      })
    },
    enabled: params.enabled ?? true
  })
}
```

#### Blockchain Data

```typescript
// Transaction monitoring
export function useTransaction(txId?: string) {
  return useQuery({
    queryKey: ['transaction', txId, config.network],
    queryFn: () => fetchTransaction({ txId: txId!, network: config.network }),
    enabled: !!txId
  })
}

// Block information
export function useBlock(height?: number) {
  return useQuery({
    queryKey: ['block', height, config.network],
    queryFn: () => fetchBlock({ height: height!, network: config.network }),
    enabled: typeof height === 'number'
  })
}

// Account transaction history
export function useAccountTransactions(address?: string) {
  return useQuery({
    queryKey: ['account-transactions', address, config.network],
    queryFn: () => fetchAccountTransactions({ address: address!, network: config.network }),
    enabled: !!address
  })
}
```

**Available Generic Hooks:**
- `useAccount` - Connection state and address management
- `useConnect` - Wallet connection with SIP-030 support
- `useDisconnect` - Clean wallet disconnection
- `useNetwork` - Network information and utilities
- `useContract` - Generic contract interaction with broadcast API
- `useReadContract` - Generic read-only contract calls
- `useTransaction` - Transaction details and status
- `useBlock` - Block information by height
- `useAccountTransactions` - Transaction history for accounts
- `useWaitForTransaction` - Transaction confirmation monitoring

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

#### Basic Contract Interaction

```typescript
import { 
  useNftContractGetOwner, 
  useNftContractTransfer,
  useAccount,
  useConnect,
  useDisconnect 
} from './generated/hooks'

function NFTComponent({ tokenId }: { tokenId: bigint }) {
  // Connection management
  const { address, isConnected } = useAccount()
  const connect = useConnect()
  const disconnect = useDisconnect()
  
  // Contract interactions
  const { data: owner, isLoading } = useNftContractGetOwner(tokenId)
  const transfer = useNftContractTransfer({
    onSuccess: (data) => console.log('Transfer successful:', data),
    onError: (error) => console.error('Transfer failed:', error)
  })

  const handleConnect = () => {
    connect.mutate({ forceWalletSelect: true })
  }

  const handleTransfer = () => {
    if (!address) return
    
    transfer.broadcast({
      id: tokenId,
      sender: address,
      recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159'
    })
  }

  if (!isConnected) {
    return (
      <button onClick={handleConnect} disabled={connect.isPending}>
        {connect.isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  if (isLoading) return <div>Loading NFT data...</div>

  return (
    <div>
      <p>Connected: {address}</p>
      <p>NFT Owner: {owner}</p>
      <button 
        onClick={handleTransfer}
        disabled={transfer.isPending}
      >
        {transfer.isPending ? 'Transferring...' : 'Transfer NFT'}
      </button>
      <button onClick={() => disconnect.mutate()}>
        Disconnect
      </button>
    </div>
  )
}
```

#### Generic Hook Usage

```typescript
import { useContract, useReadContract, useTransaction } from './generated/stacks'
import { myContract } from './generated/contracts'

function GenericContractExample() {
  // Generic contract interaction
  const contract = useContract({
    onSuccess: (data) => console.log('Success:', data)
  })
  
  // Generic read contract
  const { data: balance } = useReadContract({
    contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
    contractName: 'token-contract',
    functionName: 'get-balance',
    args: { owner: 'SP...' }
  })
  
  // Transaction monitoring
  const { data: txData } = useTransaction('0x1234...')

  const handleGenericCall = () => {
    // Use with generated contract interface
    const contractCall = myContract.someFunction({ param: 'value' })
    contract.broadcast(contractCall)
  }

  const handleDirectCall = () => {
    // Or use directly
    contract.broadcast({
      contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      contractName: 'my-contract',
      functionName: 'some-function',
      functionArgs: ['value']
    })
  }

  return (
    <div>
      <p>Balance: {balance}</p>
      <p>Transaction Status: {txData?.tx_status}</p>
      <button onClick={handleGenericCall}>
        Call with Contract Interface
      </button>
      <button onClick={handleDirectCall}>
        Direct Contract Call
      </button>
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

## Before vs After: See the Difference

### Without @stacks/codegen (Manual Approach)

Using raw [@stacks/transactions](https://stacks.js.org/modules/_stacks_transactions) and [@stacks/connect](https://www.npmjs.com/package/@stacks/connect) requires manual ClarityValue conversion and is error-prone:

#### Connection Management
```typescript
import { connect, disconnect, isConnected } from '@stacks/connect'

// ❌ Manual connection state management
const [isConnected, setIsConnected] = useState(false)
const [address, setAddress] = useState<string>()

const handleConnect = async () => {
  try {
    await connect()
    const connected = isConnected()
    setIsConnected(connected)
    // Manual address fetching...
  } catch (error) {
    console.error('Connection failed:', error)
  }
}
```

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

### With @stacks/codegen (Generated Approach)

Clean, type-safe, and automatic ClarityValue conversion API:

#### Connection Management
```typescript
import { useAccount, useConnect, useDisconnect } from './generated/stacks'

// ✅ Clean, automatic state management
function WalletConnection() {
  const { address, isConnected, status } = useAccount()
  const connect = useConnect()
  const disconnect = useDisconnect()

  if (!isConnected) {
    return (
      <button onClick={() => connect.mutate()}>
        {connect.isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div>
      <p>Connected: {address}</p>
      <button onClick={() => disconnect.mutate()}>Disconnect</button>
    </div>
  )
}
```

#### Read-Only Function Call
```typescript
import { useReadContract } from './generated/stacks'
import { sbtcToken } from './generated/contracts'

// ✅ Clean, type-safe, automatic conversion
function TokenBalance({ address }: { address: string }) {
  const { data: balance, isLoading } = useReadContract({
    contractAddress: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
    contractName: 'sbtc-token',
    functionName: 'get-balance',
    args: { who: address } // Auto-converted!
  })

  // Or use generated contract hook
  const { data: balance2 } = useSbtcTokenGetBalance(address)

  if (isLoading) return <div>Loading...</div>
  return <div>Balance: {balance}</div>
}
```

#### Contract Call Transaction
```typescript
import { useContract } from './generated/stacks'
import { useNftContractTransfer } from './generated/hooks'
import { nftContract } from './generated/contracts'

// ✅ Type-safe, clean, automatic conversion with broadcast API
function NFTTransfer() {
  // Option 1: Use generated contract hook
  const transfer = useNftContractTransfer({
    onSuccess: (data) => console.log('Success:', data)
  })

  // Option 2: Use generic hook
  const contract = useContract()

  const handleTransfer1 = () => {
    transfer.broadcast({
      id: 1n,
      sender: 'SP2PABAF...',
      recipient: 'SP3FGQ8Z...'
    })
  }

  const handleTransfer2 = () => {
    const contractCall = nftContract.transfer({
      id: 1n,
      sender: 'SP2PABAF...',
      recipient: 'SP3FGQ8Z...'
    })
    contract.broadcast(contractCall)
  }

  return (
    <div>
      <button onClick={handleTransfer1} disabled={transfer.isPending}>
        {transfer.isPending ? 'Broadcasting...' : 'Transfer NFT (Generated Hook)'}
      </button>
      <button onClick={handleTransfer2} disabled={contract.isPending}>
        {contract.isPending ? 'Broadcasting...' : 'Transfer NFT (Generic Hook)'}
      </button>
    </div>
  )
}
```

### Key Benefits

| Manual Approach | @stacks/codegen Generated |
|-----------------|----------------------|
| ❌ Manual connection state | ✅ Automatic connection management |
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
| ❌ No SIP-030 support | ✅ Full `@stacks/connect` v8 integration |

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