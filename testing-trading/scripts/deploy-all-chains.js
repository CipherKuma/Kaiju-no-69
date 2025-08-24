const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { DexDeployer } = require('./deploy-dex');

const CHAINS_TO_DEPLOY = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'polygonAmoy'];

async function deployToChain(chainName) {
  console.log(chalk.magenta(`\n${'='.repeat(60)}`));
  console.log(chalk.magenta(`Deploying to ${chainName.toUpperCase()}`));
  console.log(chalk.magenta(`${'='.repeat(60)}\n`));
  
  try {
    // Set the network for hardhat
    process.env.HARDHAT_NETWORK = chainName;
    
    // Get network config
    const { networks } = require('../config');
    const network = networks[chainName];
    
    if (!network) {
      throw new Error(`Network ${chainName} not found in config`);
    }
    
    // Check balance first
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(chalk.cyan(`Deployer: ${deployer.address}`));
    console.log(chalk.cyan(`Balance: ${ethers.formatEther(balance)} ${network.currency}`));
    
    if (balance < ethers.parseEther('0.1')) {
      console.log(chalk.red(`Insufficient balance for deployment. Need at least 0.1 ${network.currency}`));
      return null;
    }
    
    // Deploy
    const dexDeployer = new DexDeployer(network);
    await dexDeployer.deployFullDex();
    await dexDeployer.saveDeployments(chainName);
    
    // Update config
    const { updateNetworkConfig } = require('./update-deployments');
    updateNetworkConfig(chainName, dexDeployer.deployments);
    
    console.log(chalk.green(`\n✅ Successfully deployed to ${chainName}!`));
    return dexDeployer.deployments;
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to deploy to ${chainName}:`), error.message);
    return null;
  }
}

async function main() {
  console.log(chalk.blue(`
╔═══════════════════════════════════════════════════════════╗
║           DEX Deployment to Multiple Chains               ║
║                                                           ║
║  This will deploy:                                        ║
║  - Test tokens (WETH, USDC, USDT, DAI, LINK, SHAPE)     ║
║  - Uniswap V2 Factory and Router                         ║
║  - Trading pairs with initial liquidity                  ║
║                                                           ║
║  Target chains: ${CHAINS_TO_DEPLOY.join(', ')}
╚═══════════════════════════════════════════════════════════╝
  `));
  
  const results = {};
  
  for (const chain of CHAINS_TO_DEPLOY) {
    const deployment = await deployToChain(chain);
    results[chain] = deployment ? 'Success' : 'Failed';
    
    // Add delay between deployments
    if (deployment && chain !== CHAINS_TO_DEPLOY[CHAINS_TO_DEPLOY.length - 1]) {
      console.log(chalk.yellow(`\nWaiting 5 seconds before next deployment...`));
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log(chalk.magenta(`\n${'='.repeat(60)}`));
  console.log(chalk.magenta(`DEPLOYMENT SUMMARY`));
  console.log(chalk.magenta(`${'='.repeat(60)}\n`));
  
  for (const [chain, status] of Object.entries(results)) {
    const icon = status === 'Success' ? '✅' : '❌';
    const color = status === 'Success' ? chalk.green : chalk.red;
    console.log(color(`${icon} ${chain}: ${status}`));
  }
  
  // Show deployed contract addresses
  console.log(chalk.cyan(`\nDeployed Contract Addresses:`));
  for (const chain of CHAINS_TO_DEPLOY) {
    if (results[chain] === 'Success') {
      const deploymentPath = path.join(__dirname, '..', 'deployments', `${chain}.json`);
      if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        console.log(chalk.yellow(`\n${chain}:`));
        console.log(`  USDC: ${deployment.USDC}`);
        console.log(`  Router: ${deployment.uniswapV2Router}`);
      }
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployToChain };