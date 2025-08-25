'use client'

import { useCallback, useState } from 'react'
import { useAccount, usePublicClient, useChainId } from 'wagmi'
import { formatEther, parseEther } from 'viem'

// Chain mapping for MCP faucet
const CHAIN_TO_FAUCET_ID: { [key: number]: string } = {
  1: 'ethereum-mainnet', // Not supported by faucet, but included for completeness
  11155111: 'ethereum-sepolia',
  137: 'polygon-mainnet', // Not supported by faucet
  80001: 'polygon-mumbai', // Deprecated
  42161: 'arbitrum-mainnet', // Not supported by faucet
  421614: 'arbitrum-sepolia',
} as const

export interface InsufficientFundsError {
  balance: bigint
  required: bigint
  shortfall: bigint
  canRequestFaucet: boolean
  chainName: string
}

export function useInsufficientFunds() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false)
  const [faucetError, setFaucetError] = useState<string | null>(null)

  // Check if current chain supports faucet funding
  const canRequestFaucet = useCallback(() => {
    return Object.keys(CHAIN_TO_FAUCET_ID).includes(chainId.toString())
  }, [chainId])

  // Get chain name for faucet
  const getFaucetChainName = useCallback(() => {
    return CHAIN_TO_FAUCET_ID[chainId] || null
  }, [chainId])

  // Parse insufficient funds error message
  const parseInsufficientFundsError = useCallback((error: Error): InsufficientFundsError | null => {
    const message = error.message
    
    // Look for our custom insufficient funds error format
    const match = message.match(/Insufficient funds\. Balance: ([\d.]+) ETH, Required: ([\d.]+) ETH, Shortfall: ([\d.]+) ETH/)
    
    if (match) {
      const [, balanceStr, requiredStr, shortfallStr] = match
      
      return {
        balance: parseEther(balanceStr),
        required: parseEther(requiredStr),
        shortfall: parseEther(shortfallStr),
        canRequestFaucet: canRequestFaucet(),
        chainName: getFaucetChainName() || `Chain ${chainId}`,
      }
    }

    // Fallback for generic insufficient funds errors
    if (message.toLowerCase().includes('insufficient funds')) {
      return {
        balance: 0n,
        required: 0n,
        shortfall: 0n,
        canRequestFaucet: canRequestFaucet(),
        chainName: getFaucetChainName() || `Chain ${chainId}`,
      }
    }

    return null
  }, [canRequestFaucet, getFaucetChainName, chainId])

  // Request funds from MCP faucet
  const requestFaucetFunds = useCallback(async (amount: number = 0.1): Promise<boolean> => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const faucetChain = getFaucetChainName()
    if (!faucetChain) {
      throw new Error('Faucet not supported on this chain')
    }

    setIsRequestingFaucet(true)
    setFaucetError(null)

    try {
      // Note: In a real implementation, you would call the MCP faucet function here
      // For now, we'll simulate the call and provide instructions
      
      // Simulated MCP faucet call:
      // await mcp__ops_backend__faucet({
      //   chain: faucetChain,
      //   address: address,
      //   amount: amount
      // })
      
      console.log(`Would request ${amount} ETH from faucet for ${address} on ${faucetChain}`)
      
      // For development, we'll throw an error to indicate this needs real implementation
      throw new Error(`Please manually fund your wallet or implement MCP faucet integration. Required: ${amount} ETH on ${faucetChain}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request faucet funds'
      setFaucetError(errorMessage)
      return false
    } finally {
      setIsRequestingFaucet(false)
    }
  }, [address, getFaucetChainName])

  // Get user balance
  const getCurrentBalance = useCallback(async () => {
    if (!publicClient || !address) return null
    
    try {
      const balance = await publicClient.getBalance({ address })
      return balance
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      return null
    }
  }, [publicClient, address])

  // Create helpful error message with actionable steps
  const createHelpfulErrorMessage = useCallback((insufficientFundsError: InsufficientFundsError): string => {
    const shortfallEth = formatEther(insufficientFundsError.shortfall)
    const balanceEth = formatEther(insufficientFundsError.balance)
    
    let message = `Insufficient funds. You have ${balanceEth} ETH but need ${shortfallEth} ETH more.`
    
    if (insufficientFundsError.canRequestFaucet) {
      message += ` You can request test tokens for ${insufficientFundsError.chainName}.`
    } else {
      message += ` Please add funds to your wallet manually.`
    }
    
    return message
  }, [])

  return {
    parseInsufficientFundsError,
    requestFaucetFunds,
    getCurrentBalance,
    createHelpfulErrorMessage,
    isRequestingFaucet,
    faucetError,
    canRequestFaucet: canRequestFaucet(),
    chainName: getFaucetChainName(),
  }
}