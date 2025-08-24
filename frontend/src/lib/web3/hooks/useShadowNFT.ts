'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { Address } from 'viem'
import { 
  mintShadowNFT, 
  getShadowNFTBalance,
  watchShadowNFTTransfers,
  estimateGasForMint,
  checkSufficientBalance,
} from '../contracts'
import { useTransaction } from './useTransaction'

export function useShadowNFT() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const [balance, setBalance] = useState<bigint>(0n)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [gasEstimate, setGasEstimate] = useState<{
    gasEstimate: bigint;
    gasPrice: bigint;
    totalGasCost: bigint;
    totalCostWithValue: bigint;
  } | null>(null)
  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  
  const { execute, ...mintState } = useTransaction({
    confirmations: 2,
    successMessage: 'Shadow NFT minted successfully!',
  })
  
  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicClient || !address) return
    
    setIsLoadingBalance(true)
    try {
      const bal = await getShadowNFTBalance(publicClient, address)
      setBalance(bal)
    } catch (error) {
      console.error('Failed to fetch NFT balance:', error)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [publicClient, address])
  
  // Watch for transfers
  useEffect(() => {
    if (!publicClient || !address) return
    
    const unwatch = watchShadowNFTTransfers(
      publicClient,
      (from, to, tokenId) => {
        if (from === address || to === address) {
          // Refresh balance when user is involved in transfer
          fetchBalance()
        }
      }
    )
    
    return () => unwatch()
  }, [publicClient, address, fetchBalance])
  
  // Fetch initial balance
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Estimate gas for minting
  const estimateGas = useCallback(async (
    tokenId: bigint,
    metadata: string,
    value: string
  ) => {
    if (!publicClient || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setIsEstimatingGas(true)
    try {
      const estimation = await estimateGasForMint(
        publicClient,
        walletClient,
        tokenId,
        metadata,
        value
      )
      setGasEstimate(estimation)
      return estimation
    } catch (error) {
      console.error('Gas estimation failed:', error)
      setGasEstimate(null)
      throw error
    } finally {
      setIsEstimatingGas(false)
    }
  }, [publicClient, walletClient])

  // Check if user has sufficient funds
  const checkFunds = useCallback(async (requiredAmount: bigint) => {
    if (!publicClient || !address) {
      throw new Error('Wallet not connected')
    }

    return checkSufficientBalance(publicClient, address, requiredAmount)
  }, [publicClient, address])
  
  // Mint NFT
  const mint = useCallback(async (
    tokenId: bigint,
    metadata: string,
    value: string
  ) => {
    if (!publicClient || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    return execute(
      () => mintShadowNFT(walletClient, publicClient, tokenId, metadata, value),
      'Minting Shadow NFT'
    )
  }, [publicClient, walletClient, execute])
  
  return {
    mint,
    balance,
    isLoadingBalance,
    refetchBalance: fetchBalance,
    estimateGas,
    gasEstimate,
    isEstimatingGas,
    checkFunds,
    ...mintState,
  }
}