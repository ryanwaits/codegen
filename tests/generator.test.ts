import { describe, it, expect } from "vitest";
import { generateContractInterface } from "../src/generators/contract";
import type { ResolvedContract } from "../src/types/config";

describe("Contract Generator", () => {
  const sampleContract: ResolvedContract = {
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
        {
          name: "get-info",
          access: "read-only",
          args: [],
          outputs: "bool",
        },
      ],
    },
    source: "api",
  };

  describe("Minimal Runtime", () => {
    it("should generate a simple contract interface", async () => {
      const code = await generateContractInterface([sampleContract], "minimal");

      // Check imports for minimal runtime
      expect(code).toContain(
        "import type { ContractCallParams, ReadOnlyCallParams } from 'clarity-abitype'"
      );
      expect(code).toContain("import { Cl } from '@stacks/transactions'");
      expect(code).not.toContain("fetchCallReadOnlyFunction");
      expect(code).not.toContain("makeContractCall");
      expect(code).not.toContain("openContractCall");

      // Check contract generation
      expect(code).toContain("export const testContract");
      expect(code).toContain(
        "address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
      );
      expect(code).toContain("contractName: 'test-contract'");

      // Check method generation
      expect(code).toContain("transfer(");
      expect(code).toContain("getBalance(");
      expect(code).toContain("getInfo()");

      // Should not contain helper functions
      expect(code).not.toContain("read:");
      expect(code).not.toContain("write:");
      expect(code).not.toContain("fetchTransfer");
    });
  });

  describe("Full Runtime", () => {
    it("should generate contract interface with helper functions", async () => {
      const code = await generateContractInterface([sampleContract], "full");

      // Check imports for full runtime
      expect(code).toContain(
        "import type { ContractCallParams, ReadOnlyCallParams } from 'clarity-abitype'"
      );
      expect(code).toContain("import { Cl } from '@stacks/transactions'");
      expect(code).toContain("fetchCallReadOnlyFunction, makeContractCall");
      expect(code).toContain("openContractCall");

      // Check basic contract structure
      expect(code).toContain("export const testContract");
      expect(code).toContain("transfer(");
      expect(code).toContain("getBalance(");

      // Check helper functions are generated
      expect(code).toContain("read:");
      expect(code).toContain("write:");
      expect(code).toContain("fetchTransfer");
    });

    it("should generate read helpers for read-only functions", async () => {
      const code = await generateContractInterface([sampleContract], "full");

      // Check read helpers structure
      expect(code).toContain("read: {");
      expect(code).toContain("async getBalance(");
      expect(code).toContain("async getInfo(");

      // Check read helper function signatures
      expect(code).toContain("args: { account: string }");
      expect(code).toContain("options?: {");
      expect(code).toContain("network?: 'mainnet' | 'testnet' | 'devnet'");
      expect(code).toContain("senderAddress?: string");

      // Check read helper implementation
      expect(code).toContain("fetchCallReadOnlyFunction({");
      expect(code).toContain(
        "contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'"
      );
      expect(code).toContain("contractName: 'test-contract'");
      expect(code).toContain("functionName: 'get-balance'");
      expect(code).toContain(
        "functionArgs: [Cl.standardPrincipal(args.account)]"
      );

      // Check no-args function
      expect(code).toContain("functionName: 'get-info'");
      expect(code).toContain("functionArgs: []");
    });

    it("should generate write helpers for public functions", async () => {
      const code = await generateContractInterface([sampleContract], "full");

      // Check write helpers structure
      expect(code).toContain("write: {");
      expect(code).toContain("async transfer(");

      // Check write helper function signature
      expect(code).toContain(
        "args: { amount: bigint; sender: string; recipient: string }"
      );
      expect(code).toContain("options: {");
      expect(code).toContain("senderKey: string");
      expect(code).toContain("network?: 'mainnet' | 'testnet' | 'devnet'");
      expect(code).toContain("fee?: string | number | undefined");
      expect(code).toContain("nonce?: bigint");
      expect(code).toContain("anchorMode?: 1 | 2 | 3");
      expect(code).toContain("postConditions?: any[]");
      expect(code).toContain("validateWithAbi?: boolean");

      // Check write helper implementation
      expect(code).toContain("makeContractCall({");
      expect(code).toContain("functionName: 'transfer'");
      expect(code).toContain("Cl.uint(args.amount)");
      expect(code).toContain("Cl.standardPrincipal(args.sender)");
      expect(code).toContain("Cl.standardPrincipal(args.recipient)");
      expect(code).toContain("validateWithAbi: true");
    });

    it("should generate fetch helpers for public functions", async () => {
      const code = await generateContractInterface([sampleContract], "full");

      // Check fetch helpers
      expect(code).toContain("async fetchTransfer(");

      // Check fetch helper function signature
      expect(code).toContain(
        "args: { amount: bigint; sender: string; recipient: string }"
      );
      expect(code).toContain("options?: {");
      expect(code).toContain("onFinish?: (data: any) => void");
      expect(code).toContain("onCancel?: () => void");
      expect(code).toContain("fee?: string | number | undefined");
      expect(code).toContain("anchorMode?: 1 | 2 | 3");
      expect(code).toContain("postConditions?: any[]");

      // Check fetch helper implementation
      expect(code).toContain("openContractCall({");
      expect(code).toContain("functionName: 'transfer'");
      expect(code).toContain("Cl.uint(args.amount)");
      expect(code).toContain("Cl.standardPrincipal(args.sender)");
      expect(code).toContain("Cl.standardPrincipal(args.recipient)");
    });

    it("should handle contracts with only read-only functions", async () => {
      const readOnlyContract: ResolvedContract = {
        name: "readOnlyContract",
        address: "SP123",
        contractName: "read-only",
        abi: {
          functions: [
            {
              name: "get-data",
              access: "read-only",
              args: [{ name: "id", type: "uint128" }],
              outputs: "uint128",
            },
          ],
        },
        source: "api",
      };

      const code = await generateContractInterface([readOnlyContract], "full");

      // Should have read helpers
      expect(code).toContain("read: {");
      expect(code).toContain("async getData(");

      // Should not have write or fetch helpers
      expect(code).not.toContain("write: {");
      expect(code).not.toContain("fetchGetData");
    });

    it("should handle contracts with only public functions", async () => {
      const writeOnlyContract: ResolvedContract = {
        name: "writeOnlyContract",
        address: "SP123",
        contractName: "write-only",
        abi: {
          functions: [
            {
              name: "set-data",
              access: "public",
              args: [{ name: "value", type: "uint128" }],
              outputs: { response: { ok: "bool", error: "uint128" } },
            },
          ],
        },
        source: "api",
      };

      const code = await generateContractInterface([writeOnlyContract], "full");

      // Should have write and fetch helpers
      expect(code).toContain("write: {");
      expect(code).toContain("async setData(");
      expect(code).toContain("async fetchSetData(");

      // Should not have read helpers
      expect(code).not.toContain("read: {");
    });

    it("should include TODO comments for future enhancements", async () => {
      const code = await generateContractInterface([sampleContract], "full");

      // Check for TODO comments
      expect(code).toContain("// TODO: Add proper PostCondition types");
      expect(code).toContain("// TODO: Add error handling and retry logic");
      expect(code).toContain(
        "// TODO: Add error handling for wallet connection"
      );
    });
  });

  describe("Legacy Tests", () => {
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

      // Should generate both contracts
      expect(code).toContain("export const daoContract");
      expect(code).toContain("export const testnetDaoContract");

      // Check that both have the same method but different addresses
      expect(code).toContain("vote(...args:");
      expect(code).toContain("SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9");
      expect(code).toContain("ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9");
    });
  });
});
