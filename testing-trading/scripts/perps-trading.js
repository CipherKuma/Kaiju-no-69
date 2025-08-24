const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getWallet, getNetwork } = require('../config');

class PerpsTrader {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
    this.wallet = getWallet(networkName);
    this.provider = this.wallet.provider;
    
    // Load perps deployments
    const perpsPath = path.join(__dirname, '..', 'deployments', `${networkName}-perps.json`);
    if (!fs.existsSync(perpsPath)) {
      throw new Error(`No perps deployment found for ${networkName}`);
    }
    
    this.perpsDeployments = JSON.parse(fs.readFileSync(perpsPath, 'utf8'));
  }

  async loadContracts() {
    this.oracle = await ethers.getContractAt('PriceOracle', this.perpsDeployments.priceOracle, this.wallet);
    this.exchange = await ethers.getContractAt('PerpetualExchange', this.perpsDeployments.perpetualExchange, this.wallet);
    this.usdc = await ethers.getContractAt('TestToken', this.network.contracts.USDC, this.wallet);
  }

  async displayPrices() {
    console.log(chalk.cyan(`\n=== Current Prices on ${this.network.name} ===`));
    
    const prices = await this.oracle.getAllPrices();
    
    for (let i = 0; i < prices.assets.length; i++) {
      const asset = prices.assets[i];
      const price = ethers.formatUnits(prices.prices[i], 8);
      const lastUpdate = new Date(Number(prices.timestamps[i]) * 1000).toLocaleString();
      
      console.log(`${asset}: $${parseFloat(price).toLocaleString()} (Updated: ${lastUpdate})`);
    }
  }

  async displayAccount() {
    console.log(chalk.cyan(`\n=== Account Info ===`));
    console.log(`Address: ${this.wallet.address}`);
    
    // USDC balance
    const usdcBalance = await this.usdc.balanceOf(this.wallet.address);
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`);
    
    // Exchange account
    const account = await this.exchange.getUserAccount(this.wallet.address);
    console.log(`Total Collateral: ${ethers.formatUnits(account.totalCollateral, 6)} USDC`);
    console.log(`Used Collateral: ${ethers.formatUnits(account.usedCollateral, 6)} USDC`);
    console.log(`Available Collateral: ${ethers.formatUnits(account.totalCollateral - account.usedCollateral, 6)} USDC`);
    console.log(`Active Positions: ${account.positionIds.length}`);
    
    return account;
  }

  async displayPositions() {
    console.log(chalk.cyan(`\n=== Active Positions ===`));
    
    const account = await this.exchange.getUserAccount(this.wallet.address);
    
    if (account.positionIds.length === 0) {
      console.log('No active positions');
      return;
    }
    
    for (const positionId of account.positionIds) {
      const position = await this.exchange.getPosition(positionId);
      
      if (position.isActive) {
        const currentPrice = await this.oracle.getLatestPrice(position.asset);
        const pnlData = await this.exchange.getPositionPnL(positionId);
        
        const leverage = (Number(position.size) / (Number(position.collateral) * 1e12)).toFixed(1);
        const pnl = ethers.formatUnits(pnlData.pnl, 18);
        const fees = ethers.formatUnits(pnlData.fees, 18);
        
        console.log(`\n📊 Position #${positionId}`);
        console.log(`  Asset: ${position.asset}`);
        console.log(`  Side: ${position.isLong ? 'LONG' : 'SHORT'}`);
        console.log(`  Size: $${parseFloat(ethers.formatUnits(position.size, 18)).toLocaleString()}`);
        console.log(`  Collateral: ${ethers.formatUnits(position.collateral, 6)} USDC`);
        console.log(`  Leverage: ${leverage}x`);
        console.log(`  Entry Price: $${ethers.formatUnits(position.entryPrice, 8)}`);
        console.log(`  Current Price: $${ethers.formatUnits(currentPrice, 8)}`);
        console.log(`  PnL: ${parseFloat(pnl) >= 0 ? '+' : ''}${parseFloat(pnl).toFixed(4)} USDC`);
        console.log(`  Fees: ${parseFloat(fees).toFixed(4)} USDC`);
        
        // Check if liquidatable
        const isLiquidatable = await this.isPositionLiquidatable(positionId);
        if (isLiquidatable) {
          console.log(chalk.red(`  ⚠️ LIQUIDATABLE`));
        }
      }
    }
  }

  async isPositionLiquidatable(positionId) {
    try {
      // Try to call liquidatePosition with a static call to see if it would succeed
      await this.exchange.liquidatePosition.staticCall(positionId);
      return true;
    } catch {
      return false;
    }
  }

  async depositCollateral(amount) {
    console.log(chalk.blue(`\n=== Depositing ${amount} USDC Collateral ===`));
    
    const amountWei = ethers.parseUnits(amount.toString(), 6);
    
    // Approve USDC
    console.log(chalk.yellow('Approving USDC...'));
    const approveTx = await this.usdc.approve(this.perpsDeployments.perpetualExchange, amountWei);
    await approveTx.wait();
    console.log(chalk.green('✓ USDC approved'));
    
    // Deposit
    console.log(chalk.yellow('Depositing collateral...'));
    const depositTx = await this.exchange.depositCollateral(amountWei);
    await depositTx.wait();
    console.log(chalk.green(`✓ Deposited ${amount} USDC`));
  }

  async openPosition(asset, isLong, collateralAmount, leverage) {
    console.log(chalk.blue(`\n=== Opening ${isLong ? 'LONG' : 'SHORT'} Position ===`));
    console.log(`Asset: ${asset}`);
    console.log(`Collateral: ${collateralAmount} USDC`);
    console.log(`Leverage: ${leverage}x`);
    
    const collateralWei = ethers.parseUnits(collateralAmount.toString(), 6);
    
    try {
      const tx = await this.exchange.openPosition(asset, isLong, collateralWei, leverage);
      console.log(chalk.yellow(`Transaction submitted: ${tx.hash}`));
      
      const receipt = await tx.wait();
      console.log(chalk.green('✓ Position opened successfully!'));
      
      // Find the PositionOpened event
      const event = receipt.logs.find(log => {
        try {
          const decoded = this.exchange.interface.parseLog(log);
          return decoded.name === 'PositionOpened';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const decoded = this.exchange.interface.parseLog(event);
        console.log(chalk.cyan(`Position ID: ${decoded.args.positionId}`));
      }
      
    } catch (error) {
      console.error(chalk.red('Failed to open position:'), error.message);
    }
  }

  async closePosition(positionId) {
    console.log(chalk.blue(`\n=== Closing Position #${positionId} ===`));
    
    try {
      const tx = await this.exchange.closePosition(positionId);
      console.log(chalk.yellow(`Transaction submitted: ${tx.hash}`));
      
      await tx.wait();
      console.log(chalk.green('✓ Position closed successfully!'));
      
    } catch (error) {
      console.error(chalk.red('Failed to close position:'), error.message);
    }
  }

  async updatePrices(priceUpdates) {
    console.log(chalk.blue(`\n=== Updating Prices ===`));
    
    const assets = Object.keys(priceUpdates);
    const prices = assets.map(asset => ethers.parseUnits(priceUpdates[asset].toString(), 8));
    
    try {
      const tx = await this.oracle.updatePrices(assets, prices);
      await tx.wait();
      console.log(chalk.green('✓ Prices updated successfully!'));
      
      for (const asset of assets) {
        console.log(`  ${asset}: $${priceUpdates[asset]}`);
      }
    } catch (error) {
      console.error(chalk.red('Failed to update prices:'), error.message);
    }
  }

  async liquidatePosition(positionId) {
    console.log(chalk.blue(`\n=== Liquidating Position #${positionId} ===`));
    
    try {
      const tx = await this.exchange.liquidatePosition(positionId);
      console.log(chalk.yellow(`Transaction submitted: ${tx.hash}`));
      
      await tx.wait();
      console.log(chalk.green('✓ Position liquidated successfully!'));
      
    } catch (error) {
      console.error(chalk.red('Failed to liquidate position:'), error.message);
    }
  }

  async mintUSDC(amount) {
    console.log(chalk.blue(`\n=== Minting ${amount} USDC ===`));
    
    const amountWei = ethers.parseUnits(amount.toString(), 6);
    
    try {
      const tx = await this.usdc.mintPublic(this.wallet.address, amountWei);
      await tx.wait();
      console.log(chalk.green(`✓ Minted ${amount} USDC`));
    } catch (error) {
      console.error(chalk.red('Failed to mint USDC:'), error.message);
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node perps-trading.js <network> [action] [params]'));
    console.log('Networks: shapeSepolia (others once deployed)');
    console.log('Actions:');
    console.log('  status                    - Show account and positions');
    console.log('  prices                    - Show current prices');
    console.log('  deposit <amount>          - Deposit USDC collateral');
    console.log('  mint <amount>             - Mint USDC tokens');
    console.log('  long <asset> <collateral> <leverage>   - Open long position');
    console.log('  short <asset> <collateral> <leverage>  - Open short position');
    console.log('  close <positionId>        - Close position');
    console.log('  liquidate <positionId>    - Liquidate position');
    console.log('  updateprice <asset> <price> - Update price');
    console.log('');
    console.log('Examples:');
    console.log('  node perps-trading.js shapeSepolia status');
    console.log('  node perps-trading.js shapeSepolia deposit 1000');
    console.log('  node perps-trading.js shapeSepolia long ETH 100 10');
    return;
  }
  
  const [network, action, ...params] = args;
  
  try {
    const trader = new PerpsTrader(network);
    await trader.loadContracts();
    
    switch (action) {
      case 'status':
        await trader.displayAccount();
        await trader.displayPositions();
        break;
        
      case 'prices':
        await trader.displayPrices();
        break;
        
      case 'deposit':
        const depositAmount = parseFloat(params[0]);
        await trader.depositCollateral(depositAmount);
        break;
        
      case 'mint':
        const mintAmount = parseFloat(params[0]);
        await trader.mintUSDC(mintAmount);
        break;
        
      case 'long':
        const longAsset = params[0];
        const longCollateral = parseFloat(params[1]);
        const longLeverage = parseInt(params[2]);
        await trader.openPosition(longAsset, true, longCollateral, longLeverage);
        break;
        
      case 'short':
        const shortAsset = params[0];
        const shortCollateral = parseFloat(params[1]);
        const shortLeverage = parseInt(params[2]);
        await trader.openPosition(shortAsset, false, shortCollateral, shortLeverage);
        break;
        
      case 'close':
        const closePositionId = parseInt(params[0]);
        await trader.closePosition(closePositionId);
        break;
        
      case 'liquidate':
        const liquidatePositionId = parseInt(params[0]);
        await trader.liquidatePosition(liquidatePositionId);
        break;
        
      case 'updateprice':
        const asset = params[0];
        const price = parseFloat(params[1]);
        await trader.updatePrices({ [asset]: price });
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PerpsTrader };