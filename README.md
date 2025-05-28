# @stacks/codegen

Generate fully typed contract interfaces, functions, and hooks for Clarity smart contracts.

## Usage

### 1. Utilize the generated contract interfaces with familiar libraries
```typescript
// Usage with `@stacks/transactions`
import { mega } from './generated/contracts'
import { fetchCallReadOnlyFunction, makeContractCall } from '@stacks/transactions'

await makeContractCall({
  ...mega.callback({
    sender: "SPKPXQ0X3A4D1KZ4XTP1GABJX1N36VW10D02TK9X",
    memo: "Hello world",
  }),
  network: 'mainnet',
})

await fetchCallReadOnlyFunction({
  ...mega.getBalance(),
  network: 'mainnet'
})
```

### 2. Use built-in read/write helpers
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

### 3. React integration
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
cd /path/to/your/clarinet-project
bun link @stacks/codegen
```
## Setup

To create a `stacks.config.ts` file, run `codegen init` in your Clarinet project:

```bash
codegen init
```

```typescript
// stacks.config.ts
import { defineConfig } from '@stacks/codegen'
import { clarinet } from '@stacks/codegen/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [clarinet()],
})
```

Run `⁠codegen generate` to pull the ABIs from your local Clarinet contracts and create fully type-safe interfaces for your project.

```bash
codegen generate
✔ Generation complete for 2 contracts
📄 ./src/generated/contracts.ts
```

## Advanced

### Plugins

```typescript
import { defineConfig } from '@stacks/codegen'
import { clarinet, actions, react, hiro } from '@stacks/codegen/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    clarinet(),    // Generate lLocal ABI contracts from Clarinet
    actions(),     // Add read/write helper functions
    react(),       // Generate React hooks
    hiro({         // Generate ABI contracts from Hiro API
      apiKey: process.env.HIRO_API_KEY!,
      network: 'mainnet',
      contracts: [
        'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
      ],
    }),
  ],
})
```

## Future Enhancements

1. Direct integration with Clarinet and Clarinet JS SDK for unit testing
2. More hooks

## License

MIT