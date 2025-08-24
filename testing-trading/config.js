require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Function to load deployment addresses
function loadDeploymentAddresses(networkName) {
  try {
    const deploymentPath = path.join(__dirname, 'deployments', `${networkName}.json`);
    if (fs.existsSync(deploymentPath)) {
      return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Could not load deployment for ${networkName}:`, error.message);
  }
  return {};
}

const networks = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpc: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    contracts: loadDeploymentAddresses('sepolia')
  },
  
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpc: process.env.ARB_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
    contracts: loadDeploymentAddresses('arbitrumSepolia')
  },

  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpc: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    currency: 'ETH',
    explorer: 'https://sepolia.basescan.org',
    contracts: loadDeploymentAddresses('baseSepolia')
  },

  polygonAmoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpc: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    currency: 'MATIC',
    explorer: 'https://amoy.polygonscan.com',
    contracts: loadDeploymentAddresses('polygonAmoy')
  },

  shapeSepolia: {
    name: 'Shape Sepolia',
    chainId: 11011,
    rpc: process.env.SHAPE_SEPOLIA_RPC || 'https://sepolia.shape.network',
    currency: 'ETH',
    explorer: 'https://explorer-sepolia.shape.network',
    contracts: {
      // Tokens
      WETH: '0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489',
      USDC: '0x183F03D0e64d75fe62b5cb0F8c330A1707F15d3A',
      USDT: '0x28e9112381A9c4Da0B98a0A3F65af704bd7DaAc0',
      DAI: '0xB0FC35262d8383bE97b90D01b3F5572007E7A10E',
      LINK: '0x83B085E9F68757972279826612553D398FD24C8b',
      SHAPE: '0x92F84329447e08bc02470A583f4c558E5f6BF05c',
      
      // Uniswap V2
      uniswapV2Factory: '0xbab6d9Dc29B0aFE195D4FFf5e24Dc456eCd3686C',
      uniswapV2Router: '0x92ED5E27Bea8bAbF79Cbc62e843062F6406f7644',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
    }
  }
};

const getNetwork = (networkName) => {
  const network = networks[networkName];
  if (!network) {
    throw new Error(`Network ${networkName} not supported. Available networks: ${Object.keys(networks).join(', ')}`);
  }
  return network;
};

const getProvider = (networkName) => {
  const { ethers } = require('ethers');
  const network = getNetwork(networkName);
  return new ethers.JsonRpcProvider(network.rpc);
};

const getWallet = (networkName, privateKey = process.env.PRIVATE_KEY) => {
  const { ethers } = require('ethers');
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  const provider = getProvider(networkName);
  return new ethers.Wallet(privateKey, provider);
};

module.exports = {
  networks,
  getNetwork,
  getProvider,
  getWallet
};