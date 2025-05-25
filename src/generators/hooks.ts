import { format } from "prettier";
import type { ResolvedContract } from "../types/config.js";
import type { ClarityFunction } from "clarity-abitype";

/**
 * React hooks generator for contract interfaces and generic Stacks functionality
 */

const GENERIC_HOOKS = [
  "useAccount",
  "useTransaction",
  "useBlock",
  "useAccountTransactions",
  "useWaitForTransaction",
] as const;

export async function generateContractHooks(
  contracts: ResolvedContract[]
): Promise<string> {
  const imports = `import { useQuery, useMutation } from '@tanstack/react-query'
import { useStacksConfig } from './provider'
import { openContractCall } from '@stacks/connect'
import { ${contracts.map((c) => c.name).join(", ")} } from './contracts'`;

  const header = `/**
 * Generated contract-specific React hooks
 * DO NOT EDIT MANUALLY
 */`;

  const hooksCode = contracts
    .map((contract) => generateContractHookMethods(contract))
    .join("\n\n");

  const code = `${imports}\n\n${header}\n\n${hooksCode}`;

  const formatted = await format(code, {
    parser: "typescript",
    singleQuote: true,
    semi: false,
    printWidth: 100,
    trailingComma: "es5",
  });

  return formatted;
}

export async function generateGenericHooks(
  includeHooks?: string[]
): Promise<string> {
  const hooksToGenerate = includeHooks || [...GENERIC_HOOKS];

  const imports = `import { useQuery, useMutation } from '@tanstack/react-query'
import { useStacksConfig } from './provider'
import { 
  fetchAccountInfo, 
  fetchTransaction, 
  fetchBlock,
  fetchAccountTransactions 
} from './stacks-api'`;

  const header = `/**
 * Generated generic Stacks React hooks
 * DO NOT EDIT MANUALLY
 */`;

  const hooksCode = hooksToGenerate
    .map((hookName) => generateGenericHook(hookName))
    .filter(Boolean)
    .join("\n\n");

  const code = `${imports}\n\n${header}\n\n${hooksCode}`;

  const formatted = await format(code, {
    parser: "typescript",
    singleQuote: true,
    semi: false,
    printWidth: 100,
    trailingComma: "es5",
  });

  return formatted;
}

function generateContractHookMethods(contract: ResolvedContract): string {
  const { abi, name } = contract;
  const functions = abi.functions || [];

  const readOnlyFunctions = functions.filter(
    (f: ClarityFunction) => f.access === "read-only"
  );
  const publicFunctions = functions.filter(
    (f: ClarityFunction) => f.access === "public"
  );

  const readHooks = readOnlyFunctions.map((func: ClarityFunction) =>
    generateReadHook(func, name)
  );

  const writeHooks = publicFunctions.map((func: ClarityFunction) =>
    generateWriteHook(func, name)
  );

  return [...readHooks, ...writeHooks].join("\n\n");
}

function generateReadHook(func: ClarityFunction, contractName: string): string {
  const hookName = `use${capitalize(contractName)}${capitalize(toCamelCase(func.name))}`;
  const argsSignature = generateHookArgsSignature(func.args);
  const enabledParam =
    func.args.length > 0
      ? ", options?: { enabled?: boolean }"
      : "options?: { enabled?: boolean }";

  return `export function ${hookName}(${argsSignature}${enabledParam}) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['${func.name}', ${contractName}.address, ${generateQueryKeyArgs(func.args)}],
    queryFn: () => ${contractName}.read.${toCamelCase(func.name)}(${generateFunctionCallArgs(func.args) ? `{ ${generateObjectArgs(func.args)} }, ` : ""}{ 
      network: config.network,
      senderAddress: config.senderAddress || 'SP000000000000000000002Q6VF78'
    }),
    ${func.args.length > 0 ? `enabled: ${generateEnabledCondition(func.args)} && (options?.enabled ?? true),` : ""}
    ...options
  })
}`;
}

function generateWriteHook(
  func: ClarityFunction,
  contractName: string
): string {
  const hookName = `use${capitalize(contractName)}${capitalize(toCamelCase(func.name))}`;
  const argsType = generateArgsType(func.args);

  return `export function ${hookName}() {
  return useMutation({
    mutationFn: (args: ${argsType}) =>
      new Promise((resolve, reject) => {
        openContractCall({
          ...${contractName}.${toCamelCase(func.name)}(args),
          onFinish: resolve,
          onCancel: () => reject(new Error('User cancelled transaction'))
        })
      })
  })
}`;
}

function generateGenericHook(hookName: string): string {
  switch (hookName) {
    case "useAccount":
      return `export function useAccount(address?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['account', address, config.network],
    queryFn: () => fetchAccountInfo({
      address: address!,
      network: config.network,
      apiUrl: config.apiUrl
    }),
    enabled: !!address
  })
}`;

    case "useTransaction":
      return `export function useTransaction(txId?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['transaction', txId, config.network],
    queryFn: () => fetchTransaction({
      txId: txId!,
      network: config.network,
      apiUrl: config.apiUrl
    }),
    enabled: !!txId
  })
}`;

    case "useBlock":
      return `export function useBlock(height?: number) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['block', height, config.network],
    queryFn: () => fetchBlock({
      height: height!,
      network: config.network,
      apiUrl: config.apiUrl
    }),
    enabled: typeof height === 'number'
  })
}`;

    case "useAccountTransactions":
      return `export function useAccountTransactions(address?: string) {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['account-transactions', address, config.network],
    queryFn: () => fetchAccountTransactions({
      address: address!,
      network: config.network,
      apiUrl: config.apiUrl
    }),
    enabled: !!address
  })
}`;

    case "useWaitForTransaction":
      return `export function useWaitForTransaction() {
  const config = useStacksConfig()
  
  return useMutation({
    mutationFn: async (txId: string) => {
      return new Promise((resolve, reject) => {
        const poll = async () => {
          try {
            const tx = await fetchTransaction({ 
              txId, 
              network: config.network,
              apiUrl: config.apiUrl
            })
            if (tx.tx_status === 'success') {
              resolve(tx)
            } else if (tx.tx_status === 'abort_by_response' || tx.tx_status === 'abort_by_post_condition') {
              reject(new Error(\`Transaction failed: \${tx.tx_status}\`))
            } else {
              setTimeout(poll, 2000)
            }
          } catch (error) {
            reject(error)
          }
        }
        poll()
      })
    }
  })
}`;

    default:
      return "";
  }
}

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateHookArgsSignature(args: readonly any[]): string {
  if (args.length === 0) return "";

  const argsList = args
    .map((arg) => `${toCamelCase(arg.name)}: ${mapClarityTypeToTS(arg.type)}`)
    .join(", ");
  return `${argsList}`;
}

function generateArgsType(args: readonly any[]): string {
  if (args.length === 0) return "void";

  const argsList = args
    .map((arg) => `${toCamelCase(arg.name)}: ${mapClarityTypeToTS(arg.type)}`)
    .join("; ");
  return `{ ${argsList} }`;
}

function generateQueryKeyArgs(args: readonly any[]): string {
  if (args.length === 0) return "";
  return args.map((arg) => toCamelCase(arg.name)).join(", ");
}

function generateFunctionCallArgs(args: readonly any[]): string {
  if (args.length === 0) return "";
  return args.map((arg) => toCamelCase(arg.name)).join(", ");
}

function generateEnabledCondition(args: readonly any[]): string {
  return args
    .map((arg) => {
      const camelName = toCamelCase(arg.name);
      const type = mapClarityTypeToTS(arg.type);
      if (type === "string") return `!!${camelName}`;
      if (type === "bigint") return `${camelName} !== undefined`;
      return `${camelName} !== undefined`;
    })
    .join(" && ");
}

function mapClarityTypeToTS(clarityType: any): string {
  // Handle non-string types
  if (typeof clarityType !== "string") {
    if (clarityType?.uint || clarityType?.int) return "bigint";
    if (clarityType?.principal) return "string";
    if (clarityType?.bool) return "boolean";
    if (clarityType?.string || clarityType?.ascii) return "string";
    if (clarityType?.buff) return "Uint8Array";
    if (clarityType?.optional) {
      const innerType = mapClarityTypeToTS(clarityType.optional);
      return `${innerType} | null`;
    }
    if (clarityType?.response) return "any";
    if (clarityType?.tuple) return "any";
    if (clarityType?.list) return "any[]";
    return "any";
  }

  // Handle string types
  if (clarityType.includes("uint") || clarityType.includes("int"))
    return "bigint";
  if (clarityType.includes("principal")) return "string";
  if (clarityType.includes("bool")) return "boolean";
  if (clarityType.includes("string") || clarityType.includes("ascii"))
    return "string";
  if (clarityType.includes("buff")) return "Uint8Array";
  if (clarityType.includes("optional")) {
    const innerType = clarityType.replace(/optional\s*/, "").trim();
    return `${mapClarityTypeToTS(innerType)} | null`;
  }
  if (clarityType.includes("response")) return "any"; // TODO: Better response type handling
  if (clarityType.includes("tuple")) return "any"; // TODO: Better tuple type handling
  if (clarityType.includes("list")) return "any[]"; // TODO: Better list type handling

  return "any";
}

function generateObjectArgs(args: readonly any[]): string {
  if (args.length === 0) return "";
  return args.map((arg) => `${arg.name}: ${toCamelCase(arg.name)}`).join(", ");
}
