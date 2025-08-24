'use client'

import { useBalance as useWagmiBalance, useAccount } from 'wagmi'
import { Address } from 'viem'
import { formatTokenAmount } from '../utils'

interface UseBalanceOptions {
  address?: Address
  token?: Address
  watch?: boolean
  formatUnits?: number
}

export function useBalance(options?: UseBalanceOptions) {
  const { address: accountAddress } = useAccount()
  const address = options?.address || accountAddress
  
  const { data, isError, isLoading, refetch } = useWagmiBalance({
    address,
    token: options?.token,
    query: {
      enabled: !!address,
    },
  })
  
  const formatted = data ? formatTokenAmount(
    data.value,
    options?.formatUnits || data.decimals
  ) : '0'
  
  return {
    value: data?.value || 0n,
    formatted,
    symbol: data?.symbol || 'ETH',
    decimals: data?.decimals || 18,
    isError,
    isLoading,
    refetch,
  }
}

// Hook for multiple token balances
export function useMultiBalance(
  tokens: Address[],
  options?: Omit<UseBalanceOptions, 'token'>
) {
  const balances = tokens.map(token => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const balance = useBalance({ ...options, token })
    return {
      token,
      ...balance,
    }
  })
  
  const isLoading = balances.some(b => b.isLoading)
  const isError = balances.some(b => b.isError)
  
  const refetchAll = async () => {
    await Promise.all(balances.map(b => b.refetch()))
  }
  
  return {
    balances,
    isLoading,
    isError,
    refetchAll,
  }
}