import { createConfig, http } from 'wagmi'
import {
  mainnet,
  polygon,
  arbitrum,
  sepolia,
  polygonMumbai,
  arbitrumSepolia,
} from 'wagmi/chains'
import { defineChain } from 'viem'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Define Shape mainnet
const shape = defineChain({
  id: 360,
  name: 'Shape Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.shape.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shapescan',
      url: 'https://shapescan.xyz',
    },
  },
  iconUrl: 'https://shape.network/icon.png', // Add Shape icon if available
})

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'
const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID || 'demo'

// Define supported chains based on environment
const chains = process.env.NODE_ENV === 'production'
  ? [shape, mainnet, polygon, arbitrum] as const
  : [shape, sepolia, polygonMumbai, arbitrumSepolia] as const

// Create transports for each chain
const transports = {
  [shape.id]: http('https://mainnet.shape.network'),
  [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`),
  [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyId}`),
  [arbitrum.id]: http(`https://arbitrum-mainnet.g.alchemy.com/v2/${alchemyId}`),
  [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`),
  [polygonMumbai.id]: http(`https://polygon-mumbai.g.alchemy.com/v2/${alchemyId}`),
  [arbitrumSepolia.id]: http(`https://arb-sepolia.g.alchemy.com/v2/${alchemyId}`),
}

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Kaiju No. 69',
        description: 'Shadow NFT Policy Platform',
        url: 'https://kaiju69.com',
        icons: ['https://kaiju69.com/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'Kaiju No. 69',
      appLogoUrl: 'https://kaiju69.com/icon.png',
    }),
  ],
  transports,
  ssr: true,
})

// Export chain configuration
export const supportedChains = chains
export const defaultChain = shape

// Helper to get chain by ID
export const getChainById = (chainId: number) => {
  return chains.find(chain => chain.id === chainId)
}