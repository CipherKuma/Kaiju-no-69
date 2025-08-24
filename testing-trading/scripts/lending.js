const { ethers } = require('ethers');
const chalk = require('chalk');
const { getWallet, getNetwork } = require('../config');

// Aave Pool ABI (simplified)
const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
  "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

// Aave Pool Data Provider ABI
const AAVE_DATA_PROVIDER_ABI = [
  "function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)",
  "function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)"
];

// aToken ABI
const ATOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function symbol() external view returns (string)"
];

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class LendingTester {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
    this.wallet = getWallet(networkName);
    this.provider = this.wallet.provider;
    
    if (!this.network.contracts.aavePool) {
      throw new Error(`Aave not available on ${this.networkName}`);
    }
  }

  async getTokenInfo(tokenAddress) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const [symbol, decimals, balance] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.balanceOf(this.wallet.address)
    ]);
    return { symbol, decimals, balance };
  }

  async approveToken(tokenAddress, spender, amount) {
    console.log(chalk.yellow(`Approving ${amount} tokens for ${spender}...`));
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const tx = await contract.approve(spender, amount);
    await tx.wait();
    console.log(chalk.green(`✓ Approval successful: ${tx.hash}`));
  }

  async getReserveTokens(asset) {
    const dataProvider = new ethers.Contract(
      this.network.contracts.aavePoolDataProvider,
      AAVE_DATA_PROVIDER_ABI,
      this.provider
    );
    
    return await dataProvider.getReserveTokensAddresses(asset);
  }

  async supply(asset, amount) {
    console.log(chalk.blue(`\n=== Supplying to Aave ===`));
    
    const tokenInfo = await this.getTokenInfo(asset);
    console.log(`Supplying ${ethers.formatUnits(amount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    
    // Approve tokens to Aave pool
    await this.approveToken(asset, this.network.contracts.aavePool, amount);
    
    const pool = new ethers.Contract(this.network.contracts.aavePool, AAVE_POOL_ABI, this.wallet);
    
    const tx = await pool.supply(
      asset,
      amount,
      this.wallet.address,
      0 // referral code
    );
    
    console.log(chalk.green(`✓ Supply successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async withdraw(asset, amount) {
    console.log(chalk.blue(`\n=== Withdrawing from Aave ===`));
    
    const tokenInfo = await this.getTokenInfo(asset);
    const amountStr = amount === ethers.MaxUint256 ? 'ALL' : ethers.formatUnits(amount, tokenInfo.decimals);
    console.log(`Withdrawing ${amountStr} ${tokenInfo.symbol}`);
    
    const pool = new ethers.Contract(this.network.contracts.aavePool, AAVE_POOL_ABI, this.wallet);
    
    const tx = await pool.withdraw(
      asset,
      amount,
      this.wallet.address
    );
    
    console.log(chalk.green(`✓ Withdrawal successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async borrow(asset, amount, interestRateMode = 2) {
    console.log(chalk.blue(`\n=== Borrowing from Aave ===`));
    
    const tokenInfo = await this.getTokenInfo(asset);
    console.log(`Borrowing ${ethers.formatUnits(amount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    console.log(`Interest Rate Mode: ${interestRateMode === 1 ? 'Stable' : 'Variable'}`);
    
    const pool = new ethers.Contract(this.network.contracts.aavePool, AAVE_POOL_ABI, this.wallet);
    
    const tx = await pool.borrow(
      asset,
      amount,
      interestRateMode, // 1 for stable rate, 2 for variable rate
      0, // referral code
      this.wallet.address
    );
    
    console.log(chalk.green(`✓ Borrow successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async repay(asset, amount, interestRateMode = 2) {
    console.log(chalk.blue(`\n=== Repaying to Aave ===`));
    
    const tokenInfo = await this.getTokenInfo(asset);
    const amountStr = amount === ethers.MaxUint256 ? 'ALL' : ethers.formatUnits(amount, tokenInfo.decimals);
    console.log(`Repaying ${amountStr} ${tokenInfo.symbol}`);
    
    // Approve tokens to Aave pool
    if (amount !== ethers.MaxUint256) {
      await this.approveToken(asset, this.network.contracts.aavePool, amount);
    } else {
      // For max repay, approve a large amount
      const balance = await this.getTokenInfo(asset);
      await this.approveToken(asset, this.network.contracts.aavePool, balance.balance);
    }
    
    const pool = new ethers.Contract(this.network.contracts.aavePool, AAVE_POOL_ABI, this.wallet);
    
    const tx = await pool.repay(
      asset,
      amount,
      interestRateMode,
      this.wallet.address
    );
    
    console.log(chalk.green(`✓ Repay successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async getUserAccountData() {
    const pool = new ethers.Contract(this.network.contracts.aavePool, AAVE_POOL_ABI, this.provider);
    
    const accountData = await pool.getUserAccountData(this.wallet.address);
    
    return {
      totalCollateralBase: accountData[0],
      totalDebtBase: accountData[1],
      availableBorrowsBase: accountData[2],
      currentLiquidationThreshold: accountData[3],
      ltv: accountData[4],
      healthFactor: accountData[5]
    };
  }

  async getUserReserveData(asset) {
    const dataProvider = new ethers.Contract(
      this.network.contracts.aavePoolDataProvider,
      AAVE_DATA_PROVIDER_ABI,
      this.provider
    );
    
    const reserveData = await dataProvider.getUserReserveData(asset, this.wallet.address);
    
    return {
      currentATokenBalance: reserveData[0],
      currentStableDebt: reserveData[1],
      currentVariableDebt: reserveData[2],
      principalStableDebt: reserveData[3],
      scaledVariableDebt: reserveData[4],
      stableBorrowRate: reserveData[5],
      liquidityRate: reserveData[6],
      stableRateLastUpdated: reserveData[7],
      usageAsCollateralEnabled: reserveData[8]
    };
  }

  async displayAavePositions() {
    console.log(chalk.cyan(`\n=== Aave Positions on ${this.network.name} ===`));
    console.log(`Address: ${this.wallet.address}`);
    
    try {
      // Get overall account data
      const accountData = await this.getUserAccountData();
      
      console.log(`\n📊 Account Summary:`);
      console.log(`Total Collateral: $${ethers.formatUnits(accountData.totalCollateralBase, 8)}`);
      console.log(`Total Debt: $${ethers.formatUnits(accountData.totalDebtBase, 8)}`);
      console.log(`Available to Borrow: $${ethers.formatUnits(accountData.availableBorrowsBase, 8)}`);
      console.log(`Health Factor: ${ethers.formatUnits(accountData.healthFactor, 18)}`);
      console.log(`LTV: ${Number(accountData.ltv) / 100}%`);
      
      // Check individual token positions
      const assets = [
        { address: this.network.contracts.WETH, name: 'WETH' },
        { address: this.network.contracts.USDC, name: 'USDC' }
      ];
      
      if (this.network.contracts.USDT) {
        assets.push({ address: this.network.contracts.USDT, name: 'USDT' });
      }
      
      console.log(`\n💰 Individual Positions:`);
      
      for (const asset of assets) {
        if (!asset.address) continue;
        
        try {
          const reserveData = await this.getUserReserveData(asset.address);
          const tokenInfo = await this.getTokenInfo(asset.address);
          
          if (reserveData.currentATokenBalance > 0 || reserveData.currentVariableDebt > 0 || reserveData.currentStableDebt > 0) {
            console.log(`\n${tokenInfo.symbol}:`);
            
            if (reserveData.currentATokenBalance > 0) {
              console.log(`  📈 Supplied: ${ethers.formatUnits(reserveData.currentATokenBalance, tokenInfo.decimals)}`);
            }
            
            if (reserveData.currentVariableDebt > 0) {
              console.log(`  📉 Variable Debt: ${ethers.formatUnits(reserveData.currentVariableDebt, tokenInfo.decimals)}`);
            }
            
            if (reserveData.currentStableDebt > 0) {
              console.log(`  📉 Stable Debt: ${ethers.formatUnits(reserveData.currentStableDebt, tokenInfo.decimals)}`);
            }
            
            console.log(`  🔒 Collateral Enabled: ${reserveData.usageAsCollateralEnabled ? 'Yes' : 'No'}`);
          }
        } catch (error) {
          console.log(`${asset.name}: Error reading position data`);
        }
      }
      
    } catch (error) {
      console.log('Error reading Aave positions:', error.message);
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node lending.js <network> [action] [params]'));
    console.log('Networks: sepolia, arbitrumSepolia (Aave available)');
    console.log('Actions: positions, supplyUSDC, withdrawUSDC, borrowUSDC, repayUSDC');
    console.log('Example: node lending.js sepolia positions');
    console.log('Example: node lending.js sepolia supplyUSDC 10');
    console.log('Example: node lending.js sepolia borrowUSDC 5');
    return;
  }
  
  const [network, action = 'positions', ...params] = args;
  
  try {
    const lendingTester = new LendingTester(network);
    
    switch (action) {
      case 'positions':
        await lendingTester.displayAavePositions();
        break;
        
      case 'supplyUSDC':
        const supplyAmount = params[0] || '1';
        await lendingTester.supply(
          lendingTester.network.contracts.USDC,
          ethers.parseUnits(supplyAmount, 6)
        );
        await lendingTester.displayAavePositions();
        break;
        
      case 'withdrawUSDC':
        const withdrawAmount = params[0] === 'max' 
          ? ethers.MaxUint256 
          : ethers.parseUnits(params[0] || '1', 6);
        await lendingTester.withdraw(
          lendingTester.network.contracts.USDC,
          withdrawAmount
        );
        await lendingTester.displayAavePositions();
        break;
        
      case 'borrowUSDC':
        const borrowAmount = params[0] || '1';
        const rateMode = params[1] === 'stable' ? 1 : 2;
        await lendingTester.borrow(
          lendingTester.network.contracts.USDC,
          ethers.parseUnits(borrowAmount, 6),
          rateMode
        );
        await lendingTester.displayAavePositions();
        break;
        
      case 'repayUSDC':
        const repayAmount = params[0] === 'max' 
          ? ethers.MaxUint256 
          : ethers.parseUnits(params[0] || '1', 6);
        const repayRateMode = params[1] === 'stable' ? 1 : 2;
        await lendingTester.repay(
          lendingTester.network.contracts.USDC,
          repayAmount,
          repayRateMode
        );
        await lendingTester.displayAavePositions();
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

module.exports = { LendingTester };