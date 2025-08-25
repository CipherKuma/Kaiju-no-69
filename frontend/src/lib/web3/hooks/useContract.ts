'use client'

import { useCallback } from 'react'
import { usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { Address } from 'viem'
import { getContractInstance } from '../contracts'
import { useTransaction } from './useTransaction'

export function useContractRead<T = unknown>(
  contractName: 'shadowNft' | 'policy',
  functionName: string,
  args?: readonly unknown[]
) {
  const publicClient = usePublicClient()
  const chainId = useChainId()
  
  const read = useCallback(async (): Promise<T> => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }
    
    const contract = getContractInstance(contractName, chainId, publicClient)
    const result = await contract.read[functionName](...(args || []))
    return result as T
  }, [publicClient, chainId, contractName, functionName, args])
  
  return { read }
}

export function useContractWrite(
  contractName: 'shadowNft' | 'policy',
  functionName: string,
  options?: {
    confirmations?: number
    onSuccess?: (receipt: { transactionHash: string; blockNumber: bigint; status: 'success' | 'reverted' }) => void
    onError?: (error: Error) => void
  }
) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { execute, ...transactionState } = useTransaction(options)
  
  const write = useCallback(async (
    args: readonly unknown[],
    overrides?: {
      value?: bigint
      gasPrice?: bigint
      gasLimit?: bigint
    }
  ) => {
    if (!publicClient || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    const account = walletClient.account
    if (!account) {
      throw new Error('No account found')
    }
    
    return execute(async () => {
      const contract = getContractInstance(contractName, chainId, walletClient)
      
      const hash = await contract.write[functionName](args, {
        account,
        ...overrides,
      })
      
      return hash
    }, `Executing ${functionName}`)
  }, [publicClient, walletClient, chainId, contractName, functionName, execute])
  
  return {
    write,
    ...transactionState,
  }
}