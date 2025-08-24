// Example: How to use the Web3 integration

// 1. Wrap your app with the Web3Provider in your root layout or _app.tsx:
/*
import { Web3Provider } from '@/lib/web3'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Web3Provider>
          {children}
          <Toaster position="bottom-right" />
        </Web3Provider>
      </body>
    </html>
  )
}
*/

// 2. Use the hooks in your components:
/*
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useShadowNFT,
  usePolicy,
  useBalance,
  useSwitchChain
} from '@/lib/web3'

function MyComponent() {
  // Account management
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, chains } = useSwitchChain()
  
  // NFT operations
  const { mint, balance: nftBalance } = useShadowNFT()
  
  // Policy operations
  const { create: createPolicy, claim: claimPolicy } = usePolicy()
  
  // Balance checking
  const { formatted: ethBalance, symbol } = useBalance()
  
  // Example: Connect wallet
  const handleConnect = async () => {
    const metaMaskConnector = connectors.find(c => c.id === 'io.metamask')
    if (metaMaskConnector) {
      await connect({ connector: metaMaskConnector })
    }
  }
  
  // Example: Mint NFT
  const handleMint = async () => {
    try {
      await mint(
        BigInt(Date.now()), // tokenId
        'ipfs://metadata-hash', // metadata
        '0.01' // value in ETH
      )
    } catch (error) {
      console.error('Minting failed:', error)
    }
  }
  
  // Example: Create policy
  const handleCreatePolicy = async () => {
    try {
      await createPolicy(
        BigInt(Date.now()), // policyId
        BigInt(1), // shadowNftId
        1, // policyType
        '0.001' // premium in ETH
      )
    } catch (error) {
      console.error('Policy creation failed:', error)
    }
  }
  
  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <p>Balance: {ethBalance} {symbol}</p>
          <p>NFTs: {nftBalance.toString()}</p>
          <button onClick={handleMint}>Mint NFT</button>
          <button onClick={handleCreatePolicy}>Create Policy</button>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  )
}
*/

// 3. Using custom contract hooks:
/*
import { useContractRead, useContractWrite } from '@/lib/web3'

function ContractExample() {
  // Read from contract
  const { read } = useContractRead('shadowNft', 'balanceOf', ['0x...address'])
  
  // Write to contract
  const { write, isLoading } = useContractWrite('policy', 'claimPolicy', {
    onSuccess: (receipt) => {
      console.log('Claim successful!', receipt)
    }
  })
  
  const handleClaim = async () => {
    await write([BigInt(123)]) // policyId
  }
  
  return (
    <button onClick={handleClaim} disabled={isLoading}>
      {isLoading ? 'Claiming...' : 'Claim Policy'}
    </button>
  )
}
*/

// 4. Transaction utilities:
/*
import { 
  estimateGasWithBuffer, 
  getGasPrice,
  calculateTransactionCost,
  parseWeb3Error 
} from '@/lib/web3'

async function estimateTransactionCost(publicClient: any, tx: any) {
  const gas = await estimateGasWithBuffer(publicClient, tx, 20) // 20% buffer
  const { gasPrice, formatted } = await getGasPrice(publicClient, 'fast')
  const cost = calculateTransactionCost(gas, gasPrice)
  
  console.log(`Estimated cost: ${cost.ether} ETH at ${formatted}`)
}
*/

export {}