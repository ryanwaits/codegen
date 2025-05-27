import { describe, it, expect } from "vitest";
import { generateContractInterface } from "../src/generators/contract";
import type { ResolvedContract } from "../src/types/config";

describe("Buffer Conversion Enhancement", () => {
  const contractWithBuffer: ResolvedContract = {
    name: "testContract",
    address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    contractName: "test-contract",
    source: "local" as const,
    abi: {
      functions: [
        {
          name: "store-data",
          access: "public" as const,
          args: [
            {
              name: "memo",
              type: { buff: { length: 256 } },
            },
          ],
          outputs: { type: "uint128" },
        },
        {
          name: "callback",
          access: "public" as const,
          args: [
            {
              name: "sender",
              type: "principal",
            },
            {
              name: "memo",
              type: { buff: { length: 256 } },
            },
          ],
          outputs: { type: "uint128" },
        },
      ],
    },
  };

  it("should generate flexible buffer types that accept strings", async () => {
    const code = await generateContractInterface(
      [contractWithBuffer],
      "minimal"
    );

    // Should generate union types for buffer arguments
    expect(code).toContain(
      "Uint8Array | string | { type: 'ascii' | 'utf8' | 'hex'; value: string }"
    );

    // Should be able to handle object-style and positional arguments
    expect(code).toContain("memo: Uint8Array | string");
    expect(code).toContain("sender: string");
  });

  it("should generate flexible buffer conversion code", async () => {
    const code = await generateContractInterface(
      [contractWithBuffer],
      "minimal"
    );

    // Should generate runtime conversion logic
    expect(code).toContain("value instanceof Uint8Array");
    expect(code).toContain("Cl.bufferFromAscii");
    expect(code).toContain("Cl.bufferFromUtf8");
    expect(code).toContain("Cl.bufferFromHex");
    expect(code).toContain("value.startsWith('0x')");
  });

  it("should handle different buffer input formats in generated code", async () => {
    const code = await generateContractInterface(
      [contractWithBuffer],
      "minimal"
    );

    // Verify the code contains the logic for all supported formats
    expect(code).toContain("case 'ascii':");
    expect(code).toContain("case 'utf8':");
    expect(code).toContain("case 'hex':");
    expect(code).toContain("throw new Error(`Invalid buffer value");
  });

  it("should generate contract interface that accepts the flexible buffer types", async () => {
    const code = await generateContractInterface(
      [contractWithBuffer],
      "minimal"
    );

    // Log the generated code for manual inspection
    console.log("\n=== Generated Contract Interface ===");
    console.log(code);
    console.log("=== End Generated Interface ===\n");

    // The generated interface should allow these patterns:
    // 1. mega.callback({ sender: "SP...", memo: "Hello" })
    // 2. mega.callback({ sender: "SP...", memo: new Uint8Array([72, 101, 108, 108, 111]) })
    // 3. mega.callback({ sender: "SP...", memo: { type: 'ascii', value: 'Hello' } })
    // 4. mega.callback("SP...", "Hello")

    expect(code).toContain("callback(");
    expect(code).toContain("storeData(");
  });
});
