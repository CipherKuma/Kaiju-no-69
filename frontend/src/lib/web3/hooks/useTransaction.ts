'use client'

import { useState, useCallback } from 'react'
import { Hash } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { 
  TransactionState, 
  waitForTransaction, 
  parseWeb3Error,
  getBlockExplorerUrl,
} from '../utils'

export interface UseTransactionOptions {
  confirmations?: number
  onSuccess?: (receipt: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const [state, setState] = useState<TransactionState>({
    status: 'pending',
    confirmations: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const execute = useCallback(async (
    fn: () => Promise<Hash>,
    description?: string
  ) => {
    if (!publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }
    
    setIsLoading(true)
    setState({ status: 'pending', confirmations: 0 })
    
    try {
      // Show pending toast
      const toastId = toast.loading(description || 'Confirming transaction...')
      
      // Execute transaction
      const hash = await fn()
      
      // Update state with hash
      setState(prev => ({ ...prev, hash }))
      
      // Show transaction submitted toast with explorer link
      const chainId = publicClient.chain?.id
      if (chainId) {
        const explorerUrl = getBlockExplorerUrl(chainId, 'tx', hash)
        toast.success(
          'Transaction submitted',
          {
            id: toastId,
            description: explorerUrl ? (
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                View on explorer
              </a>
            ) : hash,
          }
        )
      } else {
        toast.success('Transaction submitted', { id: toastId })
      }
      
      // Wait for confirmations
      const receipt = await waitForTransaction(
        publicClient,
        hash,
        options.confirmations || 1,
        (txState) => setState(txState)
      )
      
      // Success
      toast.success(
        options.successMessage || 'Transaction confirmed!',
        { id: toastId }
      )
      
      options.onSuccess?.(receipt)
      
      return receipt
    } catch (error) {
      const err = error as Error
      const errorMsg = parseWeb3Error(err)
      
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: err,
      }))
      
      toast.error(options.errorMessage || errorMsg)
      options.onError?.(err)
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, walletClient, options])
  
  const reset = useCallback(() => {
    setState({ status: 'pending', confirmations: 0 })
    setIsLoading(false)
  }, [])
  
  return {
    execute,
    reset,
    state,
    isLoading,
    isSuccess: state.status === 'confirmed',
    isError: state.status === 'failed' || state.status === 'reverted',
    isPending: state.status === 'pending' && !!state.hash,
  }
}