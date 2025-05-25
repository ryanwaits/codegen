import { format } from "prettier";
import type { ResolvedContract } from "../types/config.js";
import type { ClarityFunction } from "clarity-abitype";
import { useState, useCallback } from "react";
import {
  connect,
  disconnect,
  isConnected,
  request,
  openContractCall as stacksOpenContractCall,
  openSTXTransfer,
  openSignatureRequestPopup,
  openContractDeploy,
} from "@stacks/connect";

/**
 * React hooks generator for contract interfaces and generic Stacks functionality
 */

const GENERIC_HOOKS = [
  "useAccount",
  "useConnect",
  "useDisconnect",
  "useNetwork",
  "useContract",
  "useOpenSTXTransfer",
  "useSignMessage",
  "useDeployContract",
  "useReadContract",
  "useTransaction",
  "useBlock",
  "useAccountTransactions",
  "useWaitForTransaction",
] as const;

export async function generateContractHooks(
  contracts: ResolvedContract[]
): Promise<string> {
  const imports = `import { useQuery, useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useStacksConfig } from './provider'
import { useContract } from './stacks'
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

  const imports = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useStacksConfig } from './provider'
import { connect, disconnect, isConnected, request, openContractCall as stacksOpenContractCall, openSTXTransfer, openSignatureRequestPopup, openContractDeploy } from '@stacks/connect'
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
  const { openContractCall, isRequestPending } = useContract()
  
  const ${toCamelCase(func.name)} = useCallback(async (args: ${argsType}, options?: {
    postConditions?: any[];
    attachment?: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
  }) => {
    const contractCallData = ${contractName}.${toCamelCase(func.name)}(args)
    
    return await openContractCall({
      ...contractCallData,
      ...options
    })
  }, [openContractCall])

  return {
    ${toCamelCase(func.name)},
    isRequestPending
  }
}`;
}

function generateGenericHook(hookName: string): string {
  switch (hookName) {
    case "useAccount":
      return `export function useAccount() {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['stacks-account', config.network],
    queryFn: async () => {
      try {
        // Check if already connected using @stacks/connect v8
        const connected = isConnected()
        
        if (!connected) {
          return {
            address: undefined,
            addresses: undefined,
            isConnected: false,
            isConnecting: false,
            isDisconnected: true,
            status: 'disconnected' as const
          }
        }

        // Get addresses using @stacks/connect v8 request method (SIP-030)
        const result = await request('stx_getAddresses')
        
        if (!result || !result.addresses || result.addresses.length === 0) {
          return {
            address: undefined,
            addresses: undefined,
            isConnected: false,
            isConnecting: false,
            isDisconnected: true,
            status: 'disconnected' as const
          }
        }

        // Extract STX addresses from the response
        const stxAddresses = result.addresses
          .filter((addr: any) => addr.address.startsWith('SP') || addr.address.startsWith('ST'))
          .map((addr: any) => addr.address)

        return {
          address: stxAddresses[0] || undefined,
          addresses: stxAddresses,
          isConnected: true,
          isConnecting: false,
          isDisconnected: false,
          status: 'connected' as const
        }
      } catch (error) {
        // Handle case where wallet is not available or user rejected
        return {
          address: undefined,
          addresses: undefined,
          isConnected: false,
          isConnecting: false,
          isDisconnected: true,
          status: 'disconnected' as const
        }
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // Refetch every 30 seconds to detect wallet changes
  })
}`;

    case "useConnect":
      return `export function useConnect() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (options: { forceWalletSelect?: boolean } = {}) => {
      // Use @stacks/connect v8 connect method
      return await connect(options)
    },
    onSuccess: () => {
      // Invalidate account queries to refetch connection state
      queryClient.invalidateQueries({ queryKey: ['stacks-account'] })
    },
    onError: (error) => {
      console.error('Connection failed:', error)
    }
  })

  return {
    // Custom connect function that works without arguments
    connect: (options?: { forceWalletSelect?: boolean }) => {
      return mutation.mutate(options || {})
    },
    connectAsync: async (options?: { forceWalletSelect?: boolean }) => {
      return mutation.mutateAsync(options || {})
    },
    // Expose all the mutation state
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    // Keep the original mutate/mutateAsync for advanced users
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync
  }
}`;

    case "useDisconnect":
      return `export function useDisconnect() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async () => {
      // Use @stacks/connect v8 disconnect method
      return await disconnect()
    },
    onSuccess: () => {
      // Clear all cached data on disconnect
      queryClient.clear()
    },
    onError: (error) => {
      console.error('Disconnect failed:', error)
    }
  })

  return {
    // Custom disconnect function
    disconnect: () => {
      return mutation.mutate()
    },
    disconnectAsync: async () => {
      return mutation.mutateAsync()
    },
    // Expose all the mutation state
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    // Keep the original mutate/mutateAsync for advanced users
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync
  }
}`;

    case "useNetwork":
      return `export function useNetwork() {
  const config = useStacksConfig()
  
  return useQuery({
    queryKey: ['stacks-network', config.network],
    queryFn: async () => {
      // Currently read-only from config
      // Future: Use request('stx_getNetworks') when wallet support improves
      const network = config.network
      
      return {
        network,
        isMainnet: network === 'mainnet',
        isTestnet: network === 'testnet', 
        isDevnet: network === 'devnet',
        // Future: Add switchNetwork when wallets support stx_networkChange
        // switchNetwork: async (newNetwork: string) => {
        //   return await request('wallet_changeNetwork', { network: newNetwork })
        // }
      }
    },
    staleTime: Infinity, // Network config rarely changes
    refetchOnWindowFocus: false,
    retry: false
  })
}`;

    case "useContract":
      return `export function useContract() {
  const config = useStacksConfig()
  const queryClient = useQueryClient()
  const [isRequestPending, setIsRequestPending] = useState(false)
  
  const openContractCall = useCallback(async (params: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: any[];
    network?: string;
    postConditions?: any[];
    attachment?: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
  }) => {
    setIsRequestPending(true)
    
    try {
      const { contractAddress, contractName, functionName, functionArgs, onFinish, onCancel, ...options } = params
      const network = params.network || config.network || 'mainnet'
      const contract = \`\${contractAddress}.\${contractName}\`
      
      // Try @stacks/connect v8 stx_callContract first (SIP-030)
      try {
        const result = await request('stx_callContract', {
          contract,
          functionName,
          functionArgs,
          network,
          ...options
        })
        
        // Invalidate relevant queries on success
        queryClient.invalidateQueries({ 
          queryKey: ['stacks-account'] 
        })
        
        onFinish?.(result)
        return result
      } catch (connectError) {
        // Fallback to openContractCall for broader wallet compatibility
        console.warn('stx_callContract not supported, falling back to openContractCall:', connectError)
        
        return new Promise((resolve, reject) => {
          stacksOpenContractCall({
            contractAddress,
            contractName,
            functionName,
            functionArgs,
            network,
            ...options,
            onFinish: (data: any) => {
              // Invalidate relevant queries on success
              queryClient.invalidateQueries({ 
                queryKey: ['stacks-account'] 
              })
              
              onFinish?.(data)
              resolve(data)
            },
            onCancel: () => {
              onCancel?.()
              reject(new Error('User cancelled transaction'))
            }
          })
        })
      }
    } catch (error) {
      console.error('Contract call failed:', error)
      throw error instanceof Error ? error : new Error('Contract call failed')
    } finally {
      setIsRequestPending(false)
    }
  }, [config.network, queryClient])

  return {
    openContractCall,
    isRequestPending
  }
}`;

    case "useReadContract":
      return `export function useReadContract<TArgs = any, TResult = any>(params: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  args?: TArgs;
  network?: 'mainnet' | 'testnet' | 'devnet';
  enabled?: boolean;
}) {
  const config = useStacksConfig()
  
  return useQuery<TResult>({
    queryKey: ['read-contract', params.contractAddress, params.contractName, params.functionName, params.args, params.network || config.network],
    queryFn: async () => {
      const { fetchCallReadOnlyFunction } = await import('@stacks/transactions')
      
      // For now, we'll need to handle the args conversion here
      // In the future, we could integrate with the contract interface for automatic conversion
      let functionArgs: any[] = []
      
      if (params.args) {
        // This is a simplified conversion - in practice, we'd need the ABI to do proper conversion
        // For now, we'll assume the args are already in the correct format or simple types
        if (Array.isArray(params.args)) {
          functionArgs = params.args
        } else if (typeof params.args === 'object') {
          // Convert object args to array (this is a basic implementation)
          functionArgs = Object.values(params.args)
        } else {
          functionArgs = [params.args]
        }
      }
      
      return await fetchCallReadOnlyFunction({
        contractAddress: params.contractAddress,
        contractName: params.contractName,
        functionName: params.functionName,
        functionArgs,
        network: params.network || config.network || 'mainnet',
        senderAddress: config.senderAddress || 'SP000000000000000000002Q6VF78'
      }) as TResult
    },
    enabled: params.enabled ?? true
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

    case "useOpenSTXTransfer":
      return `export function useOpenSTXTransfer() {
  const config = useStacksConfig()
  const queryClient = useQueryClient()
  const [isRequestPending, setIsRequestPending] = useState(false)
  
  const openSTXTransfer = useCallback(async (params: {
    recipient: string;
    amount: string | number;
    memo?: string;
    network?: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
  }) => {
    setIsRequestPending(true)
    
    try {
      const { recipient, amount, memo, onFinish, onCancel, ...options } = params
      const network = params.network || config.network || 'mainnet'
      
      return new Promise((resolve, reject) => {
        openSTXTransfer({
          recipient,
          amount: amount.toString(),
          memo,
          network,
          ...options,
          onFinish: (data: any) => {
            // Invalidate relevant queries on success
            queryClient.invalidateQueries({ 
              queryKey: ['stacks-account'] 
            })
            
            onFinish?.(data)
            resolve(data)
          },
          onCancel: () => {
            onCancel?.()
            reject(new Error('User cancelled transaction'))
          }
        })
      })
    } catch (error) {
      console.error('STX transfer failed:', error)
      throw error instanceof Error ? error : new Error('STX transfer failed')
    } finally {
      setIsRequestPending(false)
    }
  }, [config.network, queryClient])

  return {
    openSTXTransfer,
    isRequestPending
  }
}`;

    case "useSignMessage":
      return `export function useSignMessage() {
  const config = useStacksConfig()
  const [isRequestPending, setIsRequestPending] = useState(false)
  
  const signMessage = useCallback(async (params: {
    message: string;
    network?: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
  }) => {
    setIsRequestPending(true)
    
    try {
      const { message, onFinish, onCancel, ...options } = params
      const network = params.network || config.network || 'mainnet'
      
      return new Promise((resolve, reject) => {
        openSignatureRequestPopup({
          message,
          network,
          ...options,
          onFinish: (data: any) => {
            onFinish?.(data)
            resolve(data)
          },
          onCancel: () => {
            onCancel?.()
            reject(new Error('User cancelled message signing'))
          }
        })
      })
    } catch (error) {
      console.error('Message signing failed:', error)
      throw error instanceof Error ? error : new Error('Message signing failed')
    } finally {
      setIsRequestPending(false)
    }
  }, [config.network])

  return {
    signMessage,
    isRequestPending
  }
}`;

    case "useDeployContract":
      return `export function useDeployContract() {
  const config = useStacksConfig()
  const queryClient = useQueryClient()
  const [isRequestPending, setIsRequestPending] = useState(false)
  
  const deployContract = useCallback(async (params: {
    contractName: string;
    codeBody: string;
    network?: string;
    postConditions?: any[];
    onFinish?: (data: any) => void;
    onCancel?: () => void;
  }) => {
    setIsRequestPending(true)
    
    try {
      const { contractName, codeBody, onFinish, onCancel, ...options } = params
      const network = params.network || config.network || 'mainnet'
      
      return new Promise((resolve, reject) => {
        openContractDeploy({
          contractName,
          codeBody,
          network,
          ...options,
          onFinish: (data: any) => {
            // Invalidate relevant queries on success
            queryClient.invalidateQueries({ 
              queryKey: ['stacks-account'] 
            })
            
            onFinish?.(data)
            resolve(data)
          },
          onCancel: () => {
            onCancel?.()
            reject(new Error('User cancelled contract deployment'))
          }
        })
      })
    } catch (error) {
      console.error('Contract deployment failed:', error)
      throw error instanceof Error ? error : new Error('Contract deployment failed')
    } finally {
      setIsRequestPending(false)
    }
  }, [config.network, queryClient])

  return {
    deployContract,
    isRequestPending
  }
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
