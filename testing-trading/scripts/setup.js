const { ethers } = require('ethers');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getWallet, getNetwork, networks } = require('../config');

class SetupTester {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
  }

  async createEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
      console.log(chalk.yellow('⚠️  .env file already exists'));
      return;
    }
    
    const envContent = `# DeFi Testing Environment Variables
# Add your private key here (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs (optional - defaults are provided)
SEPOLIA_RPC=https://rpc.sepolia.org
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
BASE_SEPOLIA_RPC=https://sepolia.base.org
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology

# For production use, add your own RPC URLs from:
# - Infura (infura.io)
# - Alchemy (alchemy.com)
# - QuickNode (quicknode.com)
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green('✓ Created .env file template'));
    console.log(chalk.yellow('📝 Please edit .env file and add your PRIVATE_KEY'));
  }

  async testConnection() {
    try {
      console.log(chalk.blue(`\n🔗 Testing connection to ${this.network.name}...`));
      
      const wallet = getWallet(this.networkName);
      const balance = await wallet.provider.getBalance(wallet.address);
      const blockNumber = await wallet.provider.getBlockNumber();
      
      console.log(chalk.green('✓ Connection successful!'));
      console.log(`📍 Address: ${wallet.address}`);
      console.log(`💰 Balance: ${ethers.formatEther(balance)} ${this.network.currency}`);
      console.log(`📦 Block Number: ${blockNumber}`);
      console.log(`🔗 RPC: ${this.network.rpc}`);
      
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Connection failed:'), error.message);
      return false;
    }
  }

  async checkContractAddresses() {
    console.log(chalk.blue(`\n📋 Contract Addresses on ${this.network.name}:`));
    
    const contracts = this.network.contracts;
    const provider = getWallet(this.networkName).provider;
    
    for (const [name, address] of Object.entries(contracts)) {
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        try {
          const code = await provider.getCode(address);
          const hasCode = code !== '0x';
          console.log(`${hasCode ? '✅' : '❌'} ${name}: ${address}`);
        } catch (error) {
          console.log(`❓ ${name}: ${address} (check failed)`);
        }
      } else {
        console.log(`❌ ${name}: Not available`);
      }
    }
  }

  async requestTestTokens() {
    console.log(chalk.blue('\n💰 Test Token Faucets:'));
    
    switch (this.networkName) {
      case 'sepolia':
        console.log('🚰 ETH Faucet: https://sepoliafaucet.com/');
        console.log('🚰 Alternative: https://faucet.sepolia.dev/');
        break;
        
      case 'arbitrumSepolia':
        console.log('🚰 ETH Faucet: https://faucet.quicknode.com/arbitrum/sepolia');
        break;
        
      case 'baseSepolia':
        console.log('🚰 ETH Faucet: https://faucet.quicknode.com/base/sepolia');
        break;
        
      case 'polygonAmoy':
        console.log('🚰 MATIC Faucet: https://faucet.polygon.technology/');
        break;
        
      default:
        console.log('🚰 Search for faucets for this network');
    }
    
    console.log(`\n📍 Your address: ${getWallet(this.networkName).address}`);
  }

  async runFullSetup() {
    console.log(chalk.magenta('🚀 Setting up DeFi Testing Environment\n'));
    
    // Create env file
    await this.createEnvFile();
    
    // Test all networks
    console.log(chalk.blue('\n📡 Testing Network Connections:'));
    for (const networkName of Object.keys(networks)) {
      const tester = new SetupTester(networkName);
      const connected = await tester.testConnection();
      
      if (connected) {
        await tester.checkContractAddresses();
      }
      
      console.log(''); // Add spacing
    }
    
    console.log(chalk.magenta('\n🎉 Setup complete!'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('1. Fund your wallets using the faucets above');
    console.log('2. Run: npm run swap sepolia balances');
    console.log('3. Run: npm run swap sepolia swapETHToUSDC 0.01');
    console.log('4. Explore other scripts: liquidity.js, lending.js');
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node setup.js <action> [network]'));
    console.log('Actions: env, test, contracts, faucets, all');
    console.log('Example: node setup.js all');
    console.log('Example: node setup.js test sepolia');
    return;
  }
  
  const [action, network] = args;
  
  try {
    if (action === 'all') {
      const setup = new SetupTester('sepolia'); // Default network for full setup
      await setup.runFullSetup();
      return;
    }
    
    if (!network) {
      console.log(chalk.red('Network required for this action'));
      console.log('Available networks:', Object.keys(networks).join(', '));
      return;
    }
    
    const setup = new SetupTester(network);
    
    switch (action) {
      case 'env':
        await setup.createEnvFile();
        break;
        
      case 'test':
        await setup.testConnection();
        break;
        
      case 'contracts':
        await setup.checkContractAddresses();
        break;
        
      case 'faucets':
        await setup.requestTestTokens();
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    
    if (error.message.includes('PRIVATE_KEY')) {
      console.log(chalk.yellow('\n💡 Tip: Run "node setup.js env" to create .env file'));
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { SetupTester };