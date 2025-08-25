import { 
  PublicClient, 
  WalletClient, 
  Hash, 
  TransactionReceipt,
  formatGwei,
  formatEther,
  parseEther,
  EstimateGasParameters,
  SendTransactionParameters,
} from 'viem'

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'reverted'

export interface TransactionState {
  hash?: Hash
  status: TransactionStatus
  receipt?: TransactionReceipt
  error?: Error
  confirmations: number
}

// Gas estimation utilities
export async function estimateGasWithBuffer(
  publicClient: PublicClient,
  transaction: EstimateGasParameters,
  bufferPercentage: number = 20
): Promise<bigint> {
  const estimatedGas = await publicClient.estimateGas(transaction)
  const buffer = (estimatedGas * BigInt(bufferPercentage)) / 100n
  return estimatedGas + buffer
}

export async function getGasPrice(
  publicClient: PublicClient,
  speedType: 'slow' | 'standard' | 'fast' = 'standard'
): Promise<{ gasPrice: bigint; formatted: string }> {
  const gasPrice = await publicClient.getGasPrice()
  
  // Apply multipliers based on speed
  const multipliers = {
    slow: 90n,
    standard: 100n,
    fast: 120n,
  }
  
  const adjustedGasPrice = (gasPrice * multipliers[speedType]) / 100n
  
  return {
    gasPrice: adjustedGasPrice,
    formatted: formatGwei(adjustedGasPrice),
  }
}

// Transaction status tracking
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: Hash,
  confirmations: number = 1,
  onUpdate?: (state: TransactionState) => void
): Promise<TransactionReceipt> {
  let currentConfirmations = 0
  
  // Initial pending state
  onUpdate?.({
    hash,
    status: 'pending',
    confirmations: 0,
  })
  
  try {
    // Wait for initial confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    })
    
    // Check if transaction was reverted
    if (receipt.status === 'reverted') {
      const state: TransactionState = {
        hash,
        status: 'reverted',
        receipt,
        confirmations: 1,
      }
      onUpdate?.(state)
      throw new Error('Transaction reverted')
    }
    
    // Update with first confirmation
    currentConfirmations = 1
    onUpdate?.({
      hash,
      status: 'confirmed',
      receipt,
      confirmations: currentConfirmations,
    })
    
    // Wait for additional confirmations if needed
    if (confirmations > 1) {
      const unwatch = publicClient.watchBlockNumber({
        onBlockNumber: async (blockNumber) => {
          const txReceipt = await publicClient.getTransactionReceipt({ hash })
          if (txReceipt && txReceipt.blockNumber) {
            currentConfirmations = Number(blockNumber - txReceipt.blockNumber) + 1
            
            if (currentConfirmations >= confirmations) {
              unwatch()
            }
            
            onUpdate?.({
              hash,
              status: 'confirmed',
              receipt: txReceipt,
              confirmations: currentConfirmations,
            })
          }
        },
      })
      
      // Wait for target confirmations
      while (currentConfirmations < confirmations) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return receipt
  } catch (error) {
    const state: TransactionState = {
      hash,
      status: 'failed',
      error: error as Error,
      confirmations: 0,
    }
    onUpdate?.(state)
    throw error
  }
}

// Transaction formatting utilities
export function formatTransactionValue(value: bigint): string {
  return formatEther(value)
}

export function parseTransactionValue(value: string): bigint {
  return parseEther(value)
}

export function formatGasPrice(gasPrice: bigint): string {
  return `${formatGwei(gasPrice)} Gwei`
}

// Transaction cost calculation
export function calculateTransactionCost(
  gasLimit: bigint,
  gasPrice: bigint
): { wei: bigint; ether: string } {
  const costInWei = gasLimit * gasPrice
  return {
    wei: costInWei,
    ether: formatEther(costInWei),
  }
}

// Retry transaction with higher gas
export async function retryTransactionWithHigherGas(
  walletClient: WalletClient,
  publicClient: PublicClient,
  originalTx: SendTransactionParameters,
  gasIncreasePercentage: number = 20
): Promise<Hash> {
  const currentGasPrice = await publicClient.getGasPrice()
  const newGasPrice = (currentGasPrice * BigInt(100 + gasIncreasePercentage)) / 100n
  
  const newTx = {
    ...originalTx,
    gasPrice: newGasPrice,
  } as SendTransactionParameters
  
  const hash = await walletClient.sendTransaction(newTx)
  return hash
}

// Transaction history tracking
export interface TransactionRecord {
  hash: Hash
  timestamp: Date
  type: 'mint' | 'policy' | 'claim' | 'transfer' | 'other'
  status: TransactionStatus
  value?: string
  description?: string
}

export class TransactionHistory {
  private records: Map<Hash, TransactionRecord> = new Map()
  
  addTransaction(record: TransactionRecord) {
    this.records.set(record.hash, record)
  }
  
  updateTransactionStatus(hash: Hash, status: TransactionStatus) {
    const record = this.records.get(hash)
    if (record) {
      record.status = status
    }
  }
  
  getTransaction(hash: Hash): TransactionRecord | undefined {
    return this.records.get(hash)
  }
  
  getAllTransactions(): TransactionRecord[] {
    return Array.from(this.records.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
  }
  
  getTransactionsByType(type: TransactionRecord['type']): TransactionRecord[] {
    return this.getAllTransactions().filter(tx => tx.type === type)
  }
  
  clearHistory() {
    this.records.clear()
  }
}