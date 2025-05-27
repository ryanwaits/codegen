# @stacks/codegen

Generate type-safe functions, hooks and interfaces for Clarity smart contracts with automatic type conversion and React integration.

## Usage

```bash
codegen init
codegen generate
✔ Configuration loaded
✔ Resolved 2 contracts
✔ Generated contracts at `./generated/contracts.ts`
```

### 1. Utilize the contract interface for type-safe parameters
```typescript
// Usage with `@stacks/transactions`
import { mega } from './generated/contracts'
import { makeContractCall } from '@stacks/transactions'

const callbackParams = mega.callback('SP...', 'Hello world')
await makeContractCall({
  ...params,
  network: 'mainnet',
})

const getBalanceParams = mega.getBalance()
await fetchCallReadOnlyFunction({
  ...params,
  network: 'mainnet'
})
```

### 2. Use built-in read/write helpers for convenience
```typescript
// Read helpers
const balance = await mega.read.getBalance() // {type: 'uint', value: 42000000n}

// Write helpers
const result = await mega.write.transfer(
  {
    amount: 10000n,
    recipient: "SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335",
  },
  {
    senderKey: "b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01",
  }
);
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

### `codegen init`

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

### `codegen generate`

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