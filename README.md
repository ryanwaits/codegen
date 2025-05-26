# @stacks/codegen

Generate type-safe React hooks and contract interfaces for Stacks blockchain applications.

## Why @stacks/codegen?

**Before** - Manual, error-prone contract interactions:
```typescript
// ❌ Manual Clarity conversion, no type safety
import { openContractCall } from '@stacks/connect'
import { Cl } from '@stacks/transactions'

await openContractCall({
  contractAddress: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF',
  contractName: 'BNS-V2', 
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
import { useBnsV2Transfer } from './generated/hooks'

const { transfer, isRequestPending } = useBnsV2Transfer()
  
const handleTransfer = async () => {
  await transfer({
    id: 1n,                    // Auto-converted to Cl.uint()
    owner: 'SP2PABAF...',      // Auto-converted to Cl.standardPrincipal()
    recipient: 'SP3FGQ8Z...'   // Auto-converted to Cl.standardPrincipal()
  }, {
    onFinish: data => console.log('Success:', data),
    onCancel: () => console.log('Cancelled')
  })
}
```

## Features

- 🎯 **Type-safe contract interfaces** - Full TypeScript support with automatic Clarity conversion
- ⚛️ **React hooks** - Generated hooks with micro-stacks inspired API
- 🔗 **SIP-030 compliance** - Full `@stacks/connect` v8 integration with fallbacks
- 📦 **Multiple sources** - Deployed contracts or local Clarity files
- 🚀 **Zero config** - Works out of the box with sensible defaults

## Installation

> **Note:** This package is not yet published to npm. Publishing coming soon! For now, you can install it locally:

### Local Development Setup

1. **Clone and build the package**
```bash
git clone https://github.com/your-org/stacks-codegen.git
cd stacks-codegen
bun install
bun run build
```

2. **Link globally for CLI usage**
```bash
bun link
```

3. **In your project, link the package**
```bash
cd /path/to/your/project
bun link @stacks/codegen
```

4. **Or install as a dev dependency directly from git**
```bash
# Alternative: Install directly from git
bun add -D git+https://github.com/your-org/stacks-codegen.git
```

### Once Published (Coming Soon)
```bash
npm install -D @stacks/codegen
# or
bun add -D @stacks/codegen
```

## Quick Start

1. **Initialize configuration**
```bash
# If you used bun link:
stacks init

# If you installed from git:
npx stacks init
```

2. **Configure contracts** in `stacks.config.ts`
```typescript
import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    {
      address: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2'
    },
    
    {
      address: {
        mainnet: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2',
        testnet: 'ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2-TEST'
      },
      name: 'bnsContract'
    },
    
    {
      source: './contracts/my-token.clar',
      name: 'tokenContract'
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
# If you used bun link:
stacks generate

# If you installed from git:
npx stacks generate
```

4. **Use in your React app**
```typescript
import { useBnsV2Transfer, useBnsV2GetOwner } from './generated/hooks'
import { useAccount, useConnect } from './generated/stacks'

function BNSApp() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { data: owner } = useBnsV2GetOwner(1n) // Auto-converted
  const { transfer, isRequestPending } = useBnsV2Transfer()

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>
  }

  return (
    <div>
      <p>BNS Name Owner: {owner}</p>
      <button 
        onClick={() => transfer({
          id: 1n,
          owner: address!,
          recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159'
        })}
        disabled={isRequestPending}
      >
        Transfer BNS Name
      </button>
    </div>
  )
}
```

## Contract Interface Usage

### Generated Contract Objects

```typescript
import { bnsV2 } from './generated/contracts'

// Direct usage with openContractCall
await openContractCall({
  ...bnsV2.transfer({
    id: 1n,
    owner: 'SP...',
    recipient: 'SP...'
  }),
  onFinish: data => console.log(data)
})

// Read-only functions (full runtime)
const owner = await bnsV2.read.getOwner({ id: 1n })

// Write functions with private key (full runtime)
const result = await bnsV2.write.transfer({
  id: 1n,
  owner: 'SP...',
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
const { data: owner, isLoading } = useBnsV2GetOwner(1n)
const { data: tokenUri } = useBnsV2GetTokenUri(1n)

// Write hooks with micro-stacks API
const { transfer, isRequestPending } = useBnsV2Transfer()

await transfer({
  id: 1n,
  owner: 'SP...',
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
      address: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2'
    },
    
    // Multi-network contract
    {
      address: {
        mainnet: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2',
        testnet: 'ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2-TEST'
      },
      name: 'bnsContract'
    },
    
    // Local Clarity file
    {
      source: './contracts/my-token.clar',
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

> **Note:** Replace `npx stacks` with `stacks` if you used `bun link` for global installation.

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