import { describe, it, expect, vi, beforeEach } from "vitest";
import { hiro } from "../../src/plugins/hiro/index.js";
import type { UserConfig } from "../../src/types/plugin.js";

// Mock the API client and parser
vi.mock("../../src/utils/api.js", () => ({
  StacksApiClient: vi.fn(),
}));

vi.mock("../../src/parsers/clarity.js", () => ({
  parseApiResponse: vi.fn(),
}));

describe("Hiro Plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Plugin Factory", () => {
    it("should throw error if no API key provided", () => {
      expect(() => {
        hiro({} as any);
      }).toThrow("Hiro plugin requires an API key");
    });

    it("should throw error if no network provided", () => {
      expect(() => {
        hiro({ apiKey: "test-key" } as any);
      }).toThrow("Hiro plugin requires a network");
    });

    it("should throw error if no contracts provided", () => {
      expect(() => {
        hiro({ apiKey: "test-key", network: "mainnet" } as any);
      }).toThrow("Hiro plugin requires a contracts array");
    });

    it("should throw error if contracts array is empty", () => {
      expect(() => {
        hiro({
          apiKey: "test-key",
          network: "mainnet",
          contracts: [],
        });
      }).toThrow("Hiro plugin requires a contracts array");
    });

    it("should create plugin with valid options", () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
      });

      expect(plugin.name).toBe("@secondlayer/cli/plugin-hiro");
      expect(plugin.version).toBe("1.0.0");
      expect(plugin.transformConfig).toBeDefined();
    });
  });

  describe("Config Transformation", () => {
    const mockApiClient = {
      getContractInfo: vi.fn(),
    };

    const mockParseApiResponse = vi.fn();

    beforeEach(async () => {
      // Import the modules to get the mocked versions
      const apiModule = await import("../../src/utils/api.js");
      const parserModule = await import("../../src/parsers/clarity.js");

      // Set up the mocks
      vi.mocked(apiModule.StacksApiClient).mockImplementation(
        () => mockApiClient as any
      );
      vi.mocked(parserModule.parseApiResponse).mockImplementation(
        mockParseApiResponse
      );
    });

    it("should fetch contracts and add them to config", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
      });

      const mockContractInfo = { functions: [] };
      const mockAbi = { functions: [] };

      mockApiClient.getContractInfo.mockResolvedValue(mockContractInfo);
      mockParseApiResponse.mockReturnValue(mockAbi);

      const config: UserConfig = {
        out: "./test.ts",
      };

      const result = await plugin.transformConfig!(config);

      expect(mockApiClient.getContractInfo).toHaveBeenCalledWith(
        "SP123.test-contract"
      );
      expect(mockParseApiResponse).toHaveBeenCalledWith(mockContractInfo);

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts![0]).toEqual({
        name: "test_contract",
        address: "SP123.test-contract",
        abi: mockAbi,
        metadata: {
          source: "hiro-api",
          network: "mainnet",
          fetchedAt: expect.any(String),
        },
      });
    });

    it("should handle multiple contracts", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.contract-one", "SP456.contract-two"],
      });

      const mockContractInfo = { functions: [] };
      const mockAbi = { functions: [] };

      mockApiClient.getContractInfo.mockResolvedValue(mockContractInfo);
      mockParseApiResponse.mockReturnValue(mockAbi);

      const config: UserConfig = {
        out: "./test.ts",
      };

      const result = await plugin.transformConfig!(config);

      expect(mockApiClient.getContractInfo).toHaveBeenCalledTimes(2);
      expect(result.contracts).toHaveLength(2);
      expect(result.contracts![0].name).toBe("contract_one");
      expect(result.contracts![1].name).toBe("contract_two");
    });

    it("should preserve existing contracts in config", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
      });

      const mockContractInfo = { functions: [] };
      const mockAbi = { functions: [] };

      mockApiClient.getContractInfo.mockResolvedValue(mockContractInfo);
      mockParseApiResponse.mockReturnValue(mockAbi);

      const config: UserConfig = {
        out: "./test.ts",
        contracts: [{ name: "existing", address: "existing-address" }],
      };

      const result = await plugin.transformConfig!(config);

      expect(result.contracts).toHaveLength(2);
      expect(result.contracts![0]).toEqual({
        name: "existing",
        address: "existing-address",
      });
      expect(result.contracts![1].name).toBe("test_contract");
    });

    it("should handle API errors gracefully", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
      });

      mockApiClient.getContractInfo.mockRejectedValue(
        new Error("Contract not found")
      );

      const config: UserConfig = {
        out: "./test.ts",
      };

      const result = await plugin.transformConfig!(config);

      // Should return empty array when no contracts are successfully fetched
      expect(result.contracts).toEqual([]);
    });

    it("should handle contract not found errors", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.nonexistent"],
      });

      const error = new Error("Contract not found");
      (error as any).response = { statusCode: 404 };
      mockApiClient.getContractInfo.mockRejectedValue(error);

      const config: UserConfig = {
        out: "./test.ts",
      };

      const result = await plugin.transformConfig!(config);

      expect(result.contracts).toEqual([]);
    });

    it("should handle rate limiting errors", async () => {
      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
      });

      const error = new Error("Rate limited");
      (error as any).response = { statusCode: 429 };
      mockApiClient.getContractInfo.mockRejectedValue(error);

      const config: UserConfig = {
        out: "./test.ts",
      };

      const result = await plugin.transformConfig!(config);

      expect(result.contracts).toEqual([]);
    });
  });

  describe("Debug Output", () => {
    it("should respect debug configuration", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const plugin = hiro({
        apiKey: "test-key",
        network: "mainnet",
        contracts: ["SP123.test-contract"],
        debug: true,
      });

      const mockApiClient = {
        getContractInfo: vi.fn().mockResolvedValue({ functions: [] }),
      };

      const apiModule = await import("../../src/utils/api.js");
      const parserModule = await import("../../src/parsers/clarity.js");

      vi.mocked(apiModule.StacksApiClient).mockImplementation(
        () => mockApiClient as any
      );
      vi.mocked(parserModule.parseApiResponse).mockReturnValue({
        functions: [],
      });

      const config: UserConfig = { out: "./test.ts" };
      await plugin.transformConfig!(config);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Hiro plugin: Fetching ABIs for 1 contracts from mainnet"
        )
      );

      consoleSpy.mockRestore();
    });
  });
});
