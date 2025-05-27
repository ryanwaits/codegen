# @stacks/codegen

Generate type-safe functions, hooks and interfaces for Clarity smart contracts with automatic type conversion and React integration.

## Usage

### 1. Contract Interface
```typescript
const mega = {
  // Direct function calls - returns contract call params
  callback(sender: string, memo: string) {
    return {
      contractAddress: '...',
      contractName: '...',
      functionName: 'callback',
      functionArgs: [Cl.standardPrincipal(sender), Cl.bufferFromAscii(memo)]
    }
  }
}

// Use with `@stacks/transactions`
const callbackParams = mega.callback("SP...", "Hello")
await makeContractCall({
  ...params,
  network: 'mainnet'
})

const getBalanceParams = mega.getBalance()
await fetchCallReadOnlyFunction({
  ...params,
  network: 'mainnet'
})
```

### 2. Built-in Read/Write Helpers
```typescript
// Read helpers - returns Promise<result>
const balance = await mega.read.getBalance("SP...")

// Write helpers - returns Promise<result>
const result = await mega.write.transfer(100n, "SP...")
```

### 3. React Integration
```typescript
import { useBnsV2Transfer } from './generated/hooks'

function App() {
  const { transfer, isRequestPending } = useBnsV2Transfer()
  
  return (
    <button 
      onClick={() => transfer({
        id: 1n,
        owner: 'SP...',
        recipient: 'SP...'
      })}
      disabled={isRequestPending}
    >
      Transfer
    </button>
  )
}
```

## Installation

> **Note:** This package is not yet published to npm. For now, you can install it locally:

```bash
# Clone and build
git clone https://github.com/ryanwaits/codegen.git
cd codegen
bun install
bun run build

# Link globally
bun link

# In your project
cd /path/to/your/project
bun link @stacks/codegen
```
## Configuration

### `stacks init`

Creates a `stacks.config.ts` file

```typescript
// stacks.config.ts
import { defineConfig } from '@stacks/codegen'

export default defineConfig({
  contracts: [
    // Deployed contract
    {
      address: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2'
    },
    
    // Local Clarity file
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

### `stacks generate`

This generates your code to the path set in your `stacks.config.ts` file.

## Future Enhancements

### **Simplify Config**

```ts
export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
})
```

### **Plugin System**

Add support for plugins to simplify configuration for common use cases

- Example plugins:
  - `hiro` - Fetch ABIs with Hiro API
  - `clarinet` - Generate ABIs from local Clarinet project
  - `hooks` - Generate custom hooks for your contracts

```ts
import { hiro, clarinet, hooks } from '@stacks/codegen/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [{ address: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2' }],
  plugins: [
    hiro({
      apiKey: process.env.HIRO_API_KEY!,
      network: 'mainnet',
    }),
    clarinet({
      path: './Clarinet.toml',
    }),
    hooks({
      include: ['useAccount', 'useConnect', 'useDisconnect'],
    })
  ],
})
```

## License

MIT 