# @stacks/codegen

Generate fully typed contract interfaces, functions, and React hooks for Clarity smart contracts.

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

Run `⁠codegen generate` to create fully type-safe interfaces for your contracts.

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
    clarinet(),    // Generate contract interfaces from local Clarinet project
    actions(),     // Add read/write helper functions
    react(),       // Generate React hooks
    hiro({         // Generate contract interfaces using the Hiro API
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

#### Add `testing()` plugin for unit testing

Currently, Clarinet JS SDK users must manually convert JS values to Clarity types, recall contract signatures, and write boilerplate for common tests.

_Solution:_ Enable zero-config Clarinet detection and auto-run code generation within the dev workflow.

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { initSimnet } from '@hirosystems/clarinet-sdk';
import { tokenContract } from './generated/helpers';

describe('Token Contract', () => {
  let simnet;
  
  beforeAll(async () => {
    simnet = await initSimnet();
  });
  
  it('transfers tokens', async () => {
    // Clean, focused API for testing
    const result = await tokenContract.transfer({
      amount: 1000n,
      sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    }, 'wallet_1');
    
    expect(result).toBeOk();
  });
});
```

#### Converting responses using `cvToValue`

Currently, when calling read-only functions or receiving blockchain responses, developers must manually extract values from Clarity value objects that include type metadata (e.g., `{ type: "uint", value: 42000n }`). This requires repetitive boilerplate code to access the actual values.

_Solution:_ Provide automatic Clarity value conversion with full TypeScript type inference, extracting raw values while preserving complete type safety.

```typescript
import { daoContract } from './generated/contracts';

// Before
const result = await daoContract.read.getProposal(proposalId);
// Returns complex nested structure:
// {
//   type: "tuple",
//   value: {
//     id: { type: "uint", value: 1n },
//     proposer: { type: "principal", value: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7" },
//     title: { type: "string-utf8", value: "Increase Treasury Allocation" },
//     votesFor: { type: "uint", value: 150000n },
//     votesAgainst: { type: "uint", value: 50000n },
//     startBlock: { type: "uint", value: 120500n },
//     endBlock: { type: "uint", value: 125500n },
//     executed: { type: "bool", value: false }
//   }
// }

// Tedious extraction needed:
return {
  id: result.value.id.value,
  proposer: result.value.proposer.value,
  title: result.value.title.value,
  votesFor: result.value.votesFor.value,
  votesAgainst: result.value.votesAgainst.value,
  startBlock: result.value.startBlock.value,
  endBlock: result.value.endBlock.value,
  executed: result.value.executed.value
};

// After
const proposal = await daoContract.read.getProposal(proposalId);
// Returns clean TypeScript object directly:
// {
//   id: 1n,
//   proposer: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
//   title: "Increase Treasury Allocation",
//   votesFor: 150000n,
//   votesAgainst: 50000n,
//   startBlock: 120500n,
//   endBlock: 125500n,
//   executed: false
// }

// Full type safety and IntelliSense:
console.log(proposal.endBlock); // ✅ TypeScript knows this is bigint
console.log(proposal.title);     // ✅ TypeScript knows this is string
console.log(proposal.executed);  // ✅ TypeScript knows this is boolean

return proposal;
```

#### More hooks

## License

MIT