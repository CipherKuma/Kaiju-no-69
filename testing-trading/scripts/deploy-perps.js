const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class PerpsDeployer {
  constructor() {
    this.deployments = {};
    this.network = process.env.HARDHAT_NETWORK || 'shapeSepolia';
  }

  async deployPriceOracle() {
    console.log(chalk.yellow('Deploying PriceOracle...'));
    
    const PriceOracle = await ethers.getContractFactory('PriceOracle');
    const oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();
    
    const address = await oracle.getAddress();
    console.log(chalk.green(`✓ PriceOracle deployed at: ${address}`));
    
    // Test oracle by getting initial prices
    const prices = await oracle.getAllPrices();
    console.log(chalk.cyan('Initial prices:'));
    for (let i = 0; i < prices.assets.length; i++) {
      const priceFormatted = ethers.formatUnits(prices.prices[i], 8);
      console.log(`  ${prices.assets[i]}: $${priceFormatted}`);
    }
    
    this.deployments.priceOracle = address;
    return oracle;
  }

  async deployPerpetualExchange(usdcAddress, oracleAddress) {
    console.log(chalk.yellow('Deploying PerpetualExchange...'));
    
    const PerpetualExchange = await ethers.getContractFactory('PerpetualExchange');
    const exchange = await PerpetualExchange.deploy(usdcAddress, oracleAddress);
    await exchange.waitForDeployment();
    
    const address = await exchange.getAddress();
    console.log(chalk.green(`✓ PerpetualExchange deployed at: ${address}`));
    
    // Test exchange by getting supported assets
    const assets = await exchange.getSupportedAssets();
    console.log(chalk.cyan(`Supported assets: ${assets.join(', ')}`));
    
    this.deployments.perpetualExchange = address;
    return exchange;
  }

  async deployPerpsSystem() {
    console.log(chalk.magenta('\n🚀 Deploying Perpetual Exchange System\n'));
    
    // Get network deployment info
    const deploymentPath = path.join(__dirname, '..', 'deployments', `${this.network}.json`);
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(`No deployment found for ${this.network}. Please deploy DEX first.`);
    }
    
    const networkDeployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const usdcAddress = networkDeployments.USDC;
    
    if (!usdcAddress) {
      throw new Error('USDC address not found in network deployments');
    }
    
    console.log(chalk.cyan(`Using USDC at: ${usdcAddress}`));
    
    // Deploy contracts
    const oracle = await this.deployPriceOracle();
    const exchange = await this.deployPerpetualExchange(usdcAddress, this.deployments.priceOracle);
    
    // Save deployments
    await this.saveDeployments();
    
    return { oracle, exchange };
  }

  async saveDeployments() {
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    const filePath = path.join(deploymentsDir, `${this.network}-perps.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(this.deployments, null, 2));
    console.log(chalk.green(`\n✓ Perps deployments saved to ${filePath}`));
  }

  async testBasicFunctionality() {
    console.log(chalk.blue('\n--- Testing Basic Functionality ---'));
    
    const [deployer] = await ethers.getSigners();
    console.log(`Testing with account: ${deployer.address}`);
    
    // Get contracts
    const oracle = await ethers.getContractAt('PriceOracle', this.deployments.priceOracle);
    const exchange = await ethers.getContractAt('PerpetualExchange', this.deployments.perpetualExchange);
    
    // Test price updates
    console.log(chalk.yellow('Testing price updates...'));
    await oracle.updatePrice('ETH', ethers.parseUnits('2600', 8)); // Update ETH to $2600
    const ethPrice = await oracle.getLatestPrice('ETH');
    console.log(chalk.green(`✓ ETH price updated to $${ethers.formatUnits(ethPrice, 8)}`));
    
    // Test market info
    console.log(chalk.yellow('Testing market info...'));
    const ethMarket = await exchange.getMarket('ETH');
    console.log(chalk.green(`✓ ETH market max leverage: ${ethMarket.maxLeverage}x`));
    
    console.log(chalk.green('\n✓ Basic functionality tests passed!'));
  }
}

async function main() {
  try {
    const deployer = new PerpsDeployer();
    
    const { oracle, exchange } = await deployer.deployPerpsSystem();
    await deployer.testBasicFunctionality();
    
    console.log(chalk.magenta('\n🎉 Perpetual Exchange Deployment Complete!\n'));
    console.log(chalk.cyan('Deployed Contracts:'));
    console.log(`PriceOracle: ${deployer.deployments.priceOracle}`);
    console.log(`PerpetualExchange: ${deployer.deployments.perpetualExchange}`);
    
    console.log(chalk.yellow('\n📝 Next Steps:'));
    console.log('1. Fund the PriceOracle with price update permissions');
    console.log('2. Deposit USDC collateral to start trading');
    console.log('3. Use the trading interface to open positions');
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error.message);
    process.exit(1);
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

module.exports = { PerpsDeployer };