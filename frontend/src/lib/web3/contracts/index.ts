import { 
  getContract, 
  PublicClient, 
  WalletClient, 
  parseEther,
  formatEther,
  Address,
  Hash,
} from 'viem'
import { SHADOW_NFT_ABI, POLICY_CONTRACT_ABI } from './abis'

// Contract addresses (replace with actual deployed addresses)
const CONTRACT_ADDRESSES = {
  shadowNft: {
    1: '0x0000000000000000000000000000000000000000', // mainnet
    11155111: '0x0000000000000000000000000000000000000000', // sepolia
    137: '0x0000000000000000000000000000000000000000', // polygon
    80001: '0x0000000000000000000000000000000000000000', // mumbai
    42161: '0x0000000000000000000000000000000000000000', // arbitrum
    421614: '0x0000000000000000000000000000000000000000', // arbitrum sepolia
  },
  policy: {
    1: '0x0000000000000000000000000000000000000000',
    11155111: '0x0000000000000000000000000000000000000000',
    137: '0x0000000000000000000000000000000000000000',
    80001: '0x0000000000000000000000000000000000000000',
    42161: '0x0000000000000000000000000000000000000000',
    421614: '0x0000000000000000000000000000000000000000',
  },
} as const

// Helper functions to get contract addresses
export function getShadowNFTAddress(chainId: number): Address {
  const address = CONTRACT_ADDRESSES.shadowNft[chainId as keyof typeof CONTRACT_ADDRESSES.shadowNft]
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Shadow NFT contract not deployed on chain ${chainId}`)
  }
  return address as Address
}

export function getPolicyContractAddress(chainId: number): Address {
  const address = CONTRACT_ADDRESSES.policy[chainId as keyof typeof CONTRACT_ADDRESSES.policy]
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Policy contract not deployed on chain ${chainId}`)
  }
  return address as Address
}

// Get contract instance
export function getContractInstance(
  contractName: 'shadowNft' | 'policy',
  chainId: number,
  client: PublicClient | WalletClient
) {
  const address = CONTRACT_ADDRESSES[contractName][chainId as keyof typeof CONTRACT_ADDRESSES.shadowNft]
  const abi = contractName === 'shadowNft' ? SHADOW_NFT_ABI : POLICY_CONTRACT_ABI

  if (!address) {
    throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`)
  }

  return getContract({
    address: address as Address,
    abi,
    client,
  })
}

// Gas estimation utilities
export async function estimateGasForMint(
  publicClient: PublicClient,
  walletClient: WalletClient,
  tokenId: bigint,
  metadata: string,
  value: string
): Promise<{
  gasEstimate: bigint;
  gasPrice: bigint;
  totalGasCost: bigint;
  totalCostWithValue: bigint;
}> {
  const chainId = await walletClient.getChainId()
  const account = walletClient.account

  if (!account) {
    throw new Error('No account connected')
  }

  const contract = getContractInstance('shadowNft', chainId, walletClient)
  const valueInWei = parseEther(value)
  
  // Estimate gas
  const gasEstimate = await contract.estimateGas.mintShadow(
    [tokenId, metadata],
    {
      value: valueInWei,
      account,
    }
  )

  // Get current gas price
  const gasPrice = await publicClient.getGasPrice()
  const totalGasCost = gasEstimate * gasPrice
  const totalCostWithValue = totalGasCost + valueInWei

  return {
    gasEstimate,
    gasPrice,
    totalGasCost,
    totalCostWithValue,
  }
}

// Check if account has sufficient balance
export async function checkSufficientBalance(
  publicClient: PublicClient,
  address: Address,
  requiredAmount: bigint
): Promise<{
  balance: bigint;
  hasSufficientFunds: boolean;
  shortfall: bigint;
}> {
  const balance = await publicClient.getBalance({ address })
  const hasSufficientFunds = balance >= requiredAmount
  const shortfall = hasSufficientFunds ? 0n : requiredAmount - balance

  return {
    balance,
    hasSufficientFunds,
    shortfall,
  }
}

// Shadow NFT minting utilities with enhanced error handling
export async function mintShadowNFT(
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenId: bigint,
  metadata: string,
  value: string // ETH value as string
): Promise<Hash> {
  const chainId = await walletClient.getChainId()
  const account = walletClient.account

  if (!account) {
    throw new Error('No account connected')
  }

  // First estimate gas and check balance
  const gasEstimation = await estimateGasForMint(
    publicClient,
    walletClient,
    tokenId,
    metadata,
    value
  )

  // Check if user has sufficient funds
  const balanceCheck = await checkSufficientBalance(
    publicClient,
    account.address,
    gasEstimation.totalCostWithValue
  )

  if (!balanceCheck.hasSufficientFunds) {
    const shortfallInEth = formatEther(balanceCheck.shortfall)
    const balanceInEth = formatEther(balanceCheck.balance)
    const requiredInEth = formatEther(gasEstimation.totalCostWithValue)
    
    throw new Error(
      `Insufficient funds. Balance: ${balanceInEth} ETH, Required: ${requiredInEth} ETH, Shortfall: ${shortfallInEth} ETH`
    )
  }

  const contract = getContractInstance('shadowNft', chainId, publicClient)
  
  try {
    // Simulate the contract call first
    const { request } = await publicClient.simulateContract({
      address: contract.address,
      abi: SHADOW_NFT_ABI,
      functionName: 'mintShadow',
      args: [tokenId, metadata],
      account,
      value: parseEther(value),
      gas: gasEstimation.gasEstimate,
    })
    
    // Execute the transaction
    const hash = await walletClient.writeContract(request)

    return hash
  } catch (error) {
    // Enhanced error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction')
    } else if (errorMessage?.includes('user rejected')) {
      throw new Error('Transaction rejected by user')
    } else if (errorMessage?.includes('gas')) {
      throw new Error('Transaction failed due to gas estimation error')
    } else {
      throw new Error(`Transaction failed: ${errorMessage || 'Unknown error'}`)
    }
  }
}

// Policy contract utilities
export async function createPolicy(
  walletClient: WalletClient,
  publicClient: PublicClient,
  policyId: bigint,
  shadowNftId: bigint,
  policyType: number,
  premium: string // ETH value as string
): Promise<Hash> {
  const chainId = await walletClient.getChainId()
  const account = walletClient.account

  if (!account) {
    throw new Error('No account connected')
  }

  const contract = getContractInstance('policy', chainId, publicClient)
  
  // Simulate the contract call first
  const { request } = await publicClient.simulateContract({
    address: contract.address,
    abi: POLICY_CONTRACT_ABI,
    functionName: 'createPolicy',
    args: [policyId, shadowNftId, policyType, parseEther(premium)],
    account,
    value: parseEther(premium),
  })
  
  // Execute the transaction
  const hash = await walletClient.writeContract(request)

  return hash
}

export async function claimPolicy(
  walletClient: WalletClient,
  publicClient: PublicClient,
  policyId: bigint
): Promise<Hash> {
  const chainId = await walletClient.getChainId()
  const account = walletClient.account

  if (!account) {
    throw new Error('No account connected')
  }

  const contract = getContractInstance('policy', chainId, publicClient)
  
  // Simulate the contract call first
  const { request } = await publicClient.simulateContract({
    address: contract.address,
    abi: POLICY_CONTRACT_ABI,
    functionName: 'claimPolicy',
    args: [policyId],
    account,
  })
  
  // Execute the transaction
  const hash = await walletClient.writeContract(request)

  return hash
}

// Read functions
export async function getShadowNFTBalance(
  publicClient: PublicClient,
  owner: Address
): Promise<bigint> {
  const chainId = await publicClient.getChainId()
  const contract = getContractInstance('shadowNft', chainId, publicClient)
  
  return contract.read.balanceOf([owner])
}

export async function getPolicy(
  publicClient: PublicClient,
  policyId: bigint
) {
  const chainId = await publicClient.getChainId()
  const contract = getContractInstance('policy', chainId, publicClient)
  
  const result = await contract.read.getPolicy([policyId])
  
  return {
    owner: result[0],
    shadowNftId: result[1],
    policyType: result[2],
    premium: formatEther(result[3]),
    isActive: result[4],
  }
}

// Event listeners
export function watchShadowNFTTransfers(
  publicClient: PublicClient,
  onTransfer: (from: Address, to: Address, tokenId: bigint) => void
) {
  const chainId = publicClient.chain?.id
  if (!chainId) throw new Error('Chain ID not found')
  
  const contract = getContractInstance('shadowNft', chainId, publicClient)
  
  return publicClient.watchContractEvent({
    address: contract.address,
    abi: SHADOW_NFT_ABI,
    eventName: 'Transfer',
    onLogs: (logs) => {
      logs.forEach(log => {
        const { from, to, tokenId } = log.args
        if (from && to && tokenId !== undefined) {
          onTransfer(from, to, tokenId)
        }
      })
    },
  })
}

export function watchPolicyEvents(
  publicClient: PublicClient,
  eventType: 'created' | 'claimed',
  callback: (args: unknown) => void
) {
  const chainId = publicClient.chain?.id
  if (!chainId) throw new Error('Chain ID not found')
  
  const contract = getContractInstance('policy', chainId, publicClient)
  const eventName = eventType === 'created' ? 'PolicyCreated' : 'PolicyClaimed'
  
  return publicClient.watchContractEvent({
    address: contract.address,
    abi: POLICY_CONTRACT_ABI,
    eventName,
    onLogs: (logs) => {
      logs.forEach(log => {
        callback(log.args)
      })
    },
  })
}