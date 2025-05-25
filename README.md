# @stacks/codegen

Generate type-safe React hooks and contract interfaces for Stacks blockchain applications.

## Why @stacks/codegen?

**Before** - Manual, error-prone contract interactions:
```typescript
// ❌ Manual Clarity conversion, no type safety
import { openContractCall, Cl } from '@stacks/connect'

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

**After** - Type-safe, automatic conversion:
```typescript
// ✅ Type-safe, automatic Clarity conversion, React hooks
import { useNftContractTransfer } from './generated/hooks'

function NFTTransfer() {
  const { transfer, isRequestPending } = useNftContractTransfer()
  
  const handleTransfer = () => {
    transfer({
      id: 1n,                    // Auto-converted to Cl.uint()
      sender: 'SP2PABAF...',     // Auto-converted to Cl.standardPrincipal()
      recipient: 'SP3FGQ8Z...'   // Auto-converted to Cl.standardPrincipal()
    }, {
      onFinish: data => console.log('Success:', data),
      onCancel: () => console.log('Cancelled')
    })
  }

  return (
    <button onClick={handleTransfer} disabled={isRequestPending}>
      {isRequestPending ? 'Transferring...' : 'Transfer NFT'}
    </button>
  )
}
```

## Features

- 🎯 **Type-safe contract interfaces** - Full TypeScript support with automatic Clarity conversion
- ⚛️ **React hooks** - Generated hooks with micro-stacks inspired API
- 🔗 **SIP-030 compliance** - Full `@stacks/connect` v8 integration with fallbacks
- 📦 **Multiple sources** - Deployed contracts or local Clarity files
- 🚀 **Zero config** - Works out of the box with sensible defaults

## Installation

```bash
npm install -D @stacks/codegen
```

## Quick Start

1. **Initialize configuration**
```bash
npx stacks init
```

2. **Configure contracts** in `stacks.config.ts`
```typescript
import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    {
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-contract',
      name: 'nftContract'
    }
  ],
  output: {
    path: './src/generated/contracts.ts',
    runtime: 'full', // Required for React hooks
    hooks: {
      enabled: true,
      contracts: './src/generated/hooks.ts',
      stacks: './src/generated/stacks.ts'
    }
  }
})
```

3. **Generate interfaces**
```bash
npx stacks generate
```

4. **Use in your React app**
```typescript
import { useNftContractTransfer, useNftContractGetOwner } from './generated/hooks'
import { useAccount, useConnect } from './generated/stacks'

function NFTApp() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { data: owner } = useNftContractGetOwner(1n) // Auto-converted
  const { transfer, isRequestPending } = useNftContractTransfer()

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>
  }

  return (
    <div>
      <p>NFT Owner: {owner}</p>
      <button 
        onClick={() => transfer({
          id: 1n,
          sender: address!,
          recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159'
        })}
        disabled={isRequestPending}
      >
        Transfer NFT
      </button>
    </div>
  )
}
```

## Contract Interface Usage

### Generated Contract Objects

```typescript
import { nftContract } from './generated/contracts'

// Direct usage with openContractCall
await openContractCall({
  ...nftContract.transfer({
    id: 1n,
    sender: 'SP...',
    recipient: 'SP...'
  }),
  onFinish: data => console.log(data)
})

// Read-only functions (full runtime)
const balance = await nftContract.read.getBalance({ owner: 'SP...' })

// Write functions with private key (full runtime)
const result = await nftContract.write.transfer({
  id: 1n,
  sender: 'SP...',
  recipient: 'SP...'
}, {
  senderKey: 'your-private-key',
  network: 'mainnet'
})
```

## React Hooks

### Generated Contract Hooks

```typescript
// Read-only hooks
const { data: balance, isLoading } = useNftContractGetBalance('SP...')
const { data: owner } = useNftContractGetOwner(1n)

// Write hooks with micro-stacks API
const { transfer, isRequestPending } = useNftContractTransfer()

await transfer({
  id: 1n,
  sender: 'SP...',
  recipient: 'SP...'
}, {
  postConditions: [...],
  attachment: 'Transfer memo',
  onFinish: (data) => console.log('Success:', data),
  onCancel: () => console.log('Cancelled')
})
```

### Generic Stacks Hooks

```typescript
import { 
  useAccount, 
  useConnect, 
  useContract,
  useOpenSTXTransfer,
  useSignMessage 
} from './generated/stacks'

// Connection management
const { address, isConnected } = useAccount()
const { connect } = useConnect()

// Generic contract calls
const { openContractCall, isRequestPending } = useContract()
await openContractCall({
  contractAddress: 'SP...',
  contractName: 'my-contract',
  functionName: 'my-function',
  functionArgs: [Cl.uint(123)],
  onFinish: (data) => console.log(data)
})

// STX transfers
const { openSTXTransfer } = useOpenSTXTransfer()
await openSTXTransfer({
  recipient: 'SP...',
  amount: '1000000', // 1 STX
  memo: 'Payment',
  onFinish: (data) => console.log(data)
})

// Message signing
const { signMessage } = useSignMessage()
await signMessage({
  message: 'Hello Stacks!',
  onFinish: (data) => console.log(data)
})
```

## Configuration

### Contract Sources

```typescript
export default defineConfig({
  contracts: [
    // Deployed contract
    {
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-contract'
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
})
```

### Runtime Options

```typescript
export default defineConfig({
  output: {
    runtime: 'minimal', // Just contract interfaces
    // OR
    runtime: 'full',    // Includes read/write helpers + React hooks
    hooks: {
      enabled: true,
      contracts: './src/generated/hooks.ts',
      stacks: './src/generated/stacks.ts',
      include: ['useAccount', 'useContract', 'useOpenSTXTransfer'] // Optional
    }
  }
})
```

### Available Generic Hooks

- `useAccount` - Wallet connection state
- `useConnect` / `useDisconnect` - Wallet connection management  
- `useNetwork` - Network information
- `useContract` - Generic contract calls
- `useOpenSTXTransfer` - STX transfers
- `useSignMessage` - Message signing
- `useDeployContract` - Contract deployment
- `useReadContract` - Generic read-only calls
- `useTransaction` - Transaction monitoring
- `useWaitForTransaction` - Transaction confirmation

## Provider Setup

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

## API Reference

### Commands

- `npx stacks init` - Create configuration file
- `npx stacks generate` - Generate interfaces and hooks

### Configuration Options

- `contracts` - Array of contract sources
- `output.path` - Generated contracts file path
- `output.runtime` - `'minimal'` or `'full'`
- `output.hooks.enabled` - Enable React hooks generation
- `network` - Default network (`'mainnet'` | `'testnet'` | `'devnet'`)
- `apiKey` - Hiro API key for higher rate limits

## License

MIT 