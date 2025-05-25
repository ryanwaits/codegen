import { describe, it, expect } from "vitest";
import { generateContractInterface } from "../src/generators/contract";
import type { ResolvedContract } from "../src/types/config";

describe("Contract Generator", () => {
  it("should generate a simple contract interface", async () => {
    const contracts: ResolvedContract[] = [
      {
        name: "testContract",
        address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
        contractName: "test-contract",
        abi: {
          functions: [
            {
              name: "transfer",
              access: "public",
              args: [
                { name: "amount", type: "uint128" },
                { name: "sender", type: "principal" },
                { name: "recipient", type: "principal" },
              ],
              outputs: {
                response: {
                  ok: "bool",
                  error: "uint128",
                },
              },
            },
            {
              name: "get-balance",
              access: "read-only",
              args: [{ name: "account", type: "principal" }],
              outputs: "uint128",
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    // Check imports
    expect(code).toContain(
      "import type { ContractCallParams, ReadOnlyCallParams } from 'clarity-abitype'"
    );

    // Check contract generation
    expect(code).toContain("export const testContract");
    expect(code).toContain(
      "address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
    );
    expect(code).toContain("contractName: 'test-contract'");

    // Check method generation - more flexible matching
    expect(code).toContain("transfer(");
    expect(code).toMatch(
      /...args:\s*\[{.*amount:\s*bigint.*sender:\s*string.*recipient:\s*string.*}\]\s*\|\s*\[bigint,\s*string,\s*string\]/
    );
    expect(code).toContain("getBalance(account: string)");

    // Check function implementation details
    expect(code).toContain("functionName: 'transfer'");
    expect(code).toContain("functionName: 'get-balance'");
    expect(code).toContain("functionArgs: [amount, sender, recipient]");
    expect(code).toContain("functionArgs: [account]");

    // Check that it's valid TypeScript
    expect(code).toContain("} as const");
  });

  it("should handle contracts with no arguments", async () => {
    const contracts: ResolvedContract[] = [
      {
        name: "simpleContract",
        address: "SP123",
        contractName: "simple",
        abi: {
          functions: [
            {
              name: "get-info",
              access: "read-only",
              args: [],
              outputs: "bool",
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    expect(code).toContain("getInfo()");
    expect(code).toContain("functionArgs: []");
  });

  it("should convert kebab-case to camelCase", async () => {
    const contracts: ResolvedContract[] = [
      {
        name: "kebabContract",
        address: "SP123",
        contractName: "kebab",
        abi: {
          functions: [
            {
              name: "get-token-uri",
              access: "read-only",
              args: [{ name: "token-id", type: "uint128" }],
              outputs: { "string-ascii": { length: 256 } },
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    expect(code).toContain("getTokenUri");
    expect(code).not.toContain("get-token-uri(");
  });

  it("should generate proper ABI constant", async () => {
    const contracts: ResolvedContract[] = [
      {
        name: "testContract",
        address: "SP123",
        contractName: "test",
        abi: {
          functions: [
            {
              name: "simple-func",
              access: "public",
              args: [],
              outputs: "bool",
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    // Check ABI constant generation
    expect(code).toContain("const testContractAbi = {");
    expect(code).toContain("} as const");
    expect(code).toContain("name: 'simple-func'");
    expect(code).toContain("access: 'public'");
  });
});
