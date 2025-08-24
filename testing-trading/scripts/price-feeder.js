const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Price Feeder Service for Perpetual Exchange
 * Fetches real prices from multiple sources and updates the oracle
 */
class PriceFeeder {
  constructor(networkName) {
    this.networkName = networkName;
    this.updateInterval = 30000; // 30 seconds
    this.isRunning = false;
    
    // Price sources configuration
    this.priceSources = {
      coingecko: 'https://api.coingecko.com/api/v3/simple/price',
      // Add more sources as needed
    };
    
    // Asset mapping for external APIs
    this.assetMapping = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin', 
      'LINK': 'chainlink',
      'SHAPE': 'ethereum' // Fallback to ETH for custom tokens
    };
  }

  async loadContracts() {
    try {
      // Load wallet
      const [signer] = await ethers.getSigners();
      this.wallet = signer;
      
      // Load deployments
      const perpsPath = path.join(__dirname, '..', 'deployments', `${this.networkName}-perps.json`);
      if (!fs.existsSync(perpsPath)) {
        throw new Error(`No perps deployment found for ${this.networkName}`);
      }
      
      const deployments = JSON.parse(fs.readFileSync(perpsPath, 'utf8'));
      
      // Get oracle contract
      this.oracle = await ethers.getContractAt('PriceOracle', deployments.priceOracle, this.wallet);
      
      console.log(chalk.green(`✓ Connected to PriceOracle: ${deployments.priceOracle}`));
      console.log(chalk.cyan(`📡 Wallet: ${this.wallet.address}`));
      
    } catch (error) {
      console.error(chalk.red('Failed to load contracts:'), error.message);
      throw error;
    }
  }

  async fetchPriceFromCoingecko(assets) {
    try {
      const ids = assets.map(asset => this.assetMapping[asset]).join(',');
      const response = await fetch(`${this.priceSources.coingecko}?ids=${ids}&vs_currencies=usd`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const prices = {};
      
      for (const asset of assets) {
        const coinId = this.assetMapping[asset];
        if (data[coinId] && data[coinId].usd) {
          prices[asset] = data[coinId].usd;
        }
      }
      
      return prices;
    } catch (error) {
      console.error(chalk.red('CoinGecko API error:'), error.message);
      return {};
    }
  }

  async fetchPricesFromSources(assets) {
    const allPrices = {};
    
    // Fetch from CoinGecko
    const cgPrices = await this.fetchPriceFromCoingecko(assets);
    Object.assign(allPrices, cgPrices);
    
    // Add custom/fallback prices for tokens not on CoinGecko
    if (!allPrices.SHAPE && allPrices.ETH) {
      // Example: SHAPE price could be derived from ETH or set manually
      allPrices.SHAPE = 1.0; // $1.00 for testing
    }
    
    return allPrices;
  }

  async updateOraclePrices(prices) {
    const assets = Object.keys(prices);
    const priceValues = assets.map(asset => {
      const price = prices[asset];
      return ethers.parseUnits(price.toFixed(8), 8); // 8 decimals for USD prices
    });
    
    try {
      console.log(chalk.yellow('📤 Updating oracle prices...'));
      
      const tx = await this.oracle.updatePrices(assets, priceValues);
      console.log(chalk.blue(`Transaction: ${tx.hash}`));
      
      await tx.wait();
      console.log(chalk.green('✓ Oracle prices updated successfully!'));
      
      // Log the updated prices
      for (const asset of assets) {
        console.log(chalk.cyan(`  ${asset}: $${prices[asset].toFixed(2)}`));
      }
      
      return true;
    } catch (error) {
      console.error(chalk.red('Failed to update oracle:'), error.message);
      return false;
    }
  }

  async getCurrentOraclePrices() {
    try {
      if (!this.oracle) {
        console.error('Oracle not initialized');
        return {};
      }
      
      const result = await this.oracle.getAllPrices();
      const prices = {};
      
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const price = parseFloat(ethers.formatUnits(result.prices[i], 8));
        const timestamp = new Date(Number(result.timestamps[i]) * 1000);
        
        prices[asset] = {
          price: price,
          timestamp: timestamp,
          age: Date.now() - timestamp.getTime()
        };
      }
      
      return prices;
    } catch (error) {
      console.error(chalk.red('Failed to get oracle prices:'), error.message);
      return {};
    }
  }

  async displayPriceComparison() {
    console.log(chalk.magenta('\n=== Price Comparison ==='));
    
    const assets = ['ETH', 'BTC', 'LINK', 'SHAPE'];
    const [externalPrices, oraclePrices] = await Promise.all([
      this.fetchPricesFromSources(assets),
      this.getCurrentOraclePrices()
    ]);
    
    console.log(chalk.cyan('\n📊 Current Prices:'));
    console.log('Asset | External | Oracle | Age | Deviation');
    console.log('-'.repeat(50));
    
    for (const asset of assets) {
      const external = externalPrices[asset] || 0;
      const oracle = oraclePrices[asset];
      
      if (oracle) {
        const deviation = external > 0 ? ((oracle.price - external) / external * 100) : 0;
        const ageMinutes = Math.floor(oracle.age / (1000 * 60));
        
        console.log(
          `${asset.padEnd(5)} | $${external.toFixed(2).padStart(8)} | $${oracle.price.toFixed(2).padStart(6)} | ${ageMinutes}m | ${deviation > 0 ? '+' : ''}${deviation.toFixed(2)}%`
        );
      } else {
        console.log(`${asset.padEnd(5)} | $${external.toFixed(2).padStart(8)} | N/A | N/A | N/A`);
      }
    }
  }

  async runSingleUpdate() {
    try {
      console.log(chalk.blue(`\n🔄 Fetching latest prices for ${this.networkName}...`));
      
      const assets = ['ETH', 'BTC', 'LINK', 'SHAPE'];
      const prices = await this.fetchPricesFromSources(assets);
      
      if (Object.keys(prices).length === 0) {
        console.log(chalk.red('❌ No prices fetched from external sources'));
        return false;
      }
      
      console.log(chalk.green(`✓ Fetched ${Object.keys(prices).length} prices`));
      
      const success = await this.updateOraclePrices(prices);
      
      if (success) {
        await this.displayPriceComparison();
      }
      
      return success;
    } catch (error) {
      console.error(chalk.red('Single update failed:'), error.message);
      return false;
    }
  }

  async startContinuousUpdates() {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️ Price feeder is already running'));
      return;
    }
    
    this.isRunning = true;
    console.log(chalk.green(`🚀 Starting continuous price updates (${this.updateInterval/1000}s interval)`));
    console.log(chalk.yellow('Press Ctrl+C to stop'));
    
    // Initial update
    await this.runSingleUpdate();
    
    // Set up interval
    this.updateTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.runSingleUpdate();
      }
    }, this.updateInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stopContinuousUpdates();
      process.exit(0);
    });
  }

  stopContinuousUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.isRunning = false;
    console.log(chalk.yellow('\n⏹️ Stopped continuous price updates'));
  }

  async setCustomPrice(asset, price) {
    try {
      console.log(chalk.blue(`🎯 Setting custom price for ${asset}: $${price}`));
      
      const priceWei = ethers.parseUnits(price.toString(), 8);
      const tx = await this.oracle.updatePrice(asset, priceWei);
      
      await tx.wait();
      console.log(chalk.green(`✓ ${asset} price set to $${price}`));
      
    } catch (error) {
      console.error(chalk.red('Failed to set custom price:'), error.message);
    }
  }

  async authorizeUpdater(address) {
    try {
      console.log(chalk.blue(`🔐 Authorizing price updater: ${address}`));
      
      const tx = await this.oracle.setAuthorizedUpdater(address, true);
      await tx.wait();
      
      console.log(chalk.green(`✓ Authorized ${address} as price updater`));
    } catch (error) {
      console.error(chalk.red('Failed to authorize updater:'), error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node price-feeder.js <network> [action] [params]'));
    console.log('Networks: shapeSepolia (and others once deployed)');
    console.log('Actions:');
    console.log('  update           - Single price update');
    console.log('  start            - Start continuous updates');
    console.log('  prices           - Show current prices comparison'); 
    console.log('  setprice <asset> <price> - Set custom price');
    console.log('  authorize <address> - Authorize price updater');
    console.log('');
    console.log('Examples:');
    console.log('  node price-feeder.js shapeSepolia update');
    console.log('  node price-feeder.js shapeSepolia start');
    console.log('  node price-feeder.js shapeSepolia setprice ETH 2500');
    return;
  }
  
  const [network, action = 'update', ...params] = args;
  
  try {
    const feeder = new PriceFeeder(network);
    await feeder.loadContracts();
    
    switch (action) {
      case 'update':
        await feeder.runSingleUpdate();
        break;
        
      case 'start':
        await feeder.startContinuousUpdates();
        break;
        
      case 'prices':
        await feeder.displayPriceComparison();
        break;
        
      case 'setprice':
        const asset = params[0];
        const price = parseFloat(params[1]);
        if (!asset || !price) {
          console.log(chalk.red('Usage: setprice <asset> <price>'));
          return;
        }
        await feeder.setCustomPrice(asset, price);
        break;
        
      case 'authorize':
        const address = params[0];
        if (!address) {
          console.log(chalk.red('Usage: authorize <address>'));
          return;
        }
        await feeder.authorizeUpdater(address);
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PriceFeeder };