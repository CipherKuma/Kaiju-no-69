'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { 
  createPolicy, 
  claimPolicy,
  getPolicy,
  watchPolicyEvents,
} from '../contracts'
import { useTransaction } from './useTransaction'

export interface PolicyData {
  owner: string
  shadowNftId: bigint
  policyType: number
  premium: string
  isActive: boolean
}

interface PolicyEventArgs {
  policyId?: bigint
  owner?: string
  shadowNftId?: bigint
  policyType?: number
  premium?: string
  timestamp?: bigint
}

export function usePolicy() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [recentPolicies, setRecentPolicies] = useState<PolicyEventArgs[]>([])
  
  const { execute: executeCreate, ...createState } = useTransaction({
    confirmations: 2,
    successMessage: 'Policy created successfully!',
  })
  
  const { execute: executeClaim, ...claimState } = useTransaction({
    confirmations: 2,
    successMessage: 'Policy claimed successfully!',
  })
  
  // Create policy
  const create = useCallback(async (
    policyId: bigint,
    shadowNftId: bigint,
    policyType: number,
    premium: string
  ) => {
    if (!publicClient || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    return executeCreate(
      () => createPolicy(walletClient, publicClient, policyId, shadowNftId, policyType, premium),
      'Creating insurance policy'
    )
  }, [publicClient, walletClient, executeCreate])
  
  // Claim policy
  const claim = useCallback(async (policyId: bigint) => {
    if (!publicClient || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    return executeClaim(
      () => claimPolicy(walletClient, publicClient, policyId),
      'Claiming policy'
    )
  }, [publicClient, walletClient, executeClaim])
  
  // Get policy details
  const getPolicyDetails = useCallback(async (policyId: bigint): Promise<PolicyData | null> => {
    if (!publicClient) return null
    
    try {
      const policy = await getPolicy(publicClient, policyId)
      return policy
    } catch (error) {
      console.error('Failed to fetch policy:', error)
      return null
    }
  }, [publicClient])
  
  // Watch policy events
  useEffect(() => {
    if (!publicClient) return
    
    const unwatchCreated = watchPolicyEvents(
      publicClient,
      'created',
      (args) => {
        setRecentPolicies(prev => [args as PolicyEventArgs, ...prev].slice(0, 10))
      }
    )
    
    const unwatchClaimed = watchPolicyEvents(
      publicClient,
      'claimed',
      (args) => {
        console.log('Policy claimed:', args)
      }
    )
    
    return () => {
      unwatchCreated()
      unwatchClaimed()
    }
  }, [publicClient])
  
  return {
    create,
    createState,
    claim,
    claimState,
    getPolicyDetails,
    recentPolicies,
  }
}