import { Address, isAddress } from 'viem'

// Address utilities
export function shortenAddress(address: string, chars = 4): string {
  if (!isAddress(address)) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function isValidAddress(address: string): address is Address {
  return isAddress(address)
}

// Chain utilities
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    11155111: 'Sepolia',
    80001: 'Mumbai',
    421614: 'Arbitrum Sepolia',
  }
  return chainNames[chainId] || `Chain ${chainId}`
}

export function getBlockExplorerUrl(chainId: number, type: 'tx' | 'address', hash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    11155111: 'https://sepolia.etherscan.io',
    80001: 'https://mumbai.polygonscan.com',
    421614: 'https://sepolia.arbiscan.io',
  }
  
  const baseUrl = explorers[chainId]
  if (!baseUrl) return ''
  
  return `${baseUrl}/${type}/${hash}`
}

// Token utilities
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals)
  const beforeDecimal = amount / divisor
  const afterDecimal = amount % divisor
  
  const afterDecimalStr = afterDecimal.toString().padStart(decimals, '0')
  const trimmedAfterDecimal = afterDecimalStr.replace(/0+$/, '')
  
  if (trimmedAfterDecimal === '') {
    return beforeDecimal.toString()
  }
  
  return `${beforeDecimal}.${trimmedAfterDecimal}`
}

// Network switching helpers
export function getChainRpcUrl(chainId: number, alchemyId?: string): string {
  const rpcUrls: Record<number, string> = {
    1: alchemyId ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}` : 'https://eth.llamarpc.com',
    137: alchemyId ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyId}` : 'https://polygon.llamarpc.com',
    42161: alchemyId ? `https://arbitrum-mainnet.g.alchemy.com/v2/${alchemyId}` : 'https://arbitrum.llamarpc.com',
    11155111: alchemyId ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyId}` : 'https://sepolia.gateway.tenderly.co',
    80001: alchemyId ? `https://polygon-mumbai.g.alchemy.com/v2/${alchemyId}` : 'https://rpc-mumbai.maticvigil.com',
    421614: alchemyId ? `https://arb-sepolia.g.alchemy.com/v2/${alchemyId}` : 'https://sepolia-rollup.arbitrum.io/rpc',
  }
  
  return rpcUrls[chainId] || ''
}

// Error handling
export function parseWeb3Error(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message;
    
    // User rejected transaction
    if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
      return 'Transaction was cancelled by user'
    }
    
    // Insufficient funds
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    
    // Gas estimation failed
    if (errorMessage.includes('gas required exceeds allowance')) {
      return 'Transaction would fail - please check your inputs'
    }
    
    // Contract revert
    if (errorMessage.includes('execution reverted')) {
      const revertReason = errorMessage.match(/execution reverted: (.*)/)?.[1]
      return revertReason || 'Transaction failed - contract execution reverted'
    }
    
    // Network issues
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Network connection issue - please try again'
    }
  }
  
  return 'An unexpected error occurred'
}

// Export all utilities
export * from './transactions'