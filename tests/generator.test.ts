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
    expect(code).toContain(
      "getBalance(...args: [{ account: string }] | [string])"
    );

    // Check function implementation details
    expect(code).toContain("functionName: 'transfer'");
    expect(code).toContain("functionName: 'get-balance'");
    expect(code).toContain("Cl.uint(amount),");
    expect(code).toContain("Cl.standardPrincipal(sender),");
    expect(code).toContain("Cl.standardPrincipal(recipient),");
    expect(code).toContain("Cl.standardPrincipal(account)");

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

  it("should generate multi-network contracts with proper naming", async () => {
    const contracts: ResolvedContract[] = [
      {
        name: "daoContract",
        address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
        contractName: "dao",
        abi: {
          functions: [
            {
              name: "vote",
              access: "public",
              args: [
                { name: "proposal-id", type: "uint128" },
                { name: "support", type: "bool" },
              ],
              outputs: {
                response: {
                  ok: "bool",
                  error: "uint128",
                },
              },
            },
          ],
        },
        source: "api",
      },
      {
        name: "testnetDaoContract",
        address: "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
        contractName: "dao-test",
        abi: {
          functions: [
            {
              name: "vote",
              access: "public",
              args: [
                { name: "proposal-id", type: "uint128" },
                { name: "support", type: "bool" },
              ],
              outputs: {
                response: {
                  ok: "bool",
                  error: "uint128",
                },
              },
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    // Check that both contracts are generated
    expect(code).toContain("export const daoContract");
    expect(code).toContain("export const testnetDaoContract");

    // Check mainnet contract
    expect(code).toContain(
      "address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
    );
    expect(code).toContain("contractName: 'dao'");

    // Check testnet contract
    expect(code).toContain(
      "address: 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
    );
    expect(code).toContain("contractName: 'dao-test'");

    // Check that both have the same methods
    const mainnetVoteMatch = code.match(
      /export const daoContract[\s\S]*?vote\(/
    );
    const testnetVoteMatch = code.match(
      /export const testnetDaoContract[\s\S]*?vote\(/
    );

    expect(mainnetVoteMatch).toBeTruthy();
    expect(testnetVoteMatch).toBeTruthy();

    // Check that each contract has its own ABI constant
    expect(code).toContain("const daoContractAbi = {");
    expect(code).toContain("const testnetDaoContractAbi = {");
  });

  it("should handle network filtering for multi-network contracts", async () => {
    // This test simulates what would happen when network is specified
    // We'll test with only mainnet contract to simulate network filtering
    const contracts: ResolvedContract[] = [
      {
        name: "daoContract", // Only mainnet, no testnet
        address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
        contractName: "dao",
        abi: {
          functions: [
            {
              name: "vote",
              access: "public",
              args: [
                { name: "proposal-id", type: "uint128" },
                { name: "support", type: "bool" },
              ],
              outputs: {
                response: {
                  ok: "bool",
                  error: "uint128",
                },
              },
            },
          ],
        },
        source: "api",
      },
    ];

    const code = await generateContractInterface(contracts);

    // Should only have mainnet contract
    expect(code).toContain("export const daoContract");
    expect(code).not.toContain("export const testnetDaoContract");

    // Should have mainnet address
    expect(code).toContain(
      "address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
    );
  });
});
