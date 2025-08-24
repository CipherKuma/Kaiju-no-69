const { ethers } = require('ethers');
const chalk = require('chalk');
const { getWallet, getNetwork } = require('../config');

// Uniswap V3 SwapRouter ABI
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

// Quoter V2 ABI for getting quotes
const QUOTER_ABI = [
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)"
];

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class SwapV3Tester {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
    this.wallet = getWallet(networkName);
    this.provider = this.wallet.provider;
    
    if (!this.network.contracts.uniswapV3Router) {
      throw new Error(`Uniswap V3 not available on ${this.networkName}`);
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
    console.log(chalk.yellow(`Approving tokens for ${spender}...`));
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const tx = await contract.approve(spender, amount);
    await tx.wait();
    console.log(chalk.green(`✓ Approval successful: ${tx.hash}`));
  }

  async swapTokensForETH(tokenIn, amountIn, fee = 3000, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Uniswap V3: Swapping tokens for ETH ===`));
    
    const tokenInfo = await this.getTokenInfo(tokenIn);
    console.log(`Swapping ${ethers.formatUnits(amountIn, tokenInfo.decimals)} ${tokenInfo.symbol} for ETH`);
    console.log(`Fee tier: ${fee / 10000}%`);
    
    // Approve tokens
    await this.approveToken(tokenIn, this.network.contracts.uniswapV3Router, amountIn);
    
    const router = new ethers.Contract(this.network.contracts.uniswapV3Router, SWAP_ROUTER_ABI, this.wallet);
    
    const params = {
      tokenIn: tokenIn,
      tokenOut: this.network.contracts.WETH,
      fee: fee,
      recipient: this.wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountIn,
      amountOutMinimum: 0, // In production, calculate based on slippage
      sqrtPriceLimitX96: 0
    };
    
    try {
      const tx = await router.exactInputSingle(params);
      console.log(chalk.green(`✓ V3 Swap initiated: ${tx.hash}`));
      const receipt = await tx.wait();
      console.log(chalk.green(`✓ Swap confirmed!`));
      
      // Note: In V3, ETH comes as WETH, user needs to unwrap manually
      console.log(chalk.yellow(`Note: You received WETH. Use WETH contract to unwrap to ETH if needed.`));
      
      return receipt;
    } catch (error) {
      // Try different fee tiers if the first one fails
      if (error.message.includes('revert') && fee === 3000) {
        console.log(chalk.yellow('Trying different fee tier (0.05%)...'));
        return await this.swapTokensForETH(tokenIn, amountIn, 500, slippage);
      }
      throw error;
    }
  }

  async swapETHForTokens(tokenOut, amountIn, fee = 3000, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Uniswap V3: Swapping ${ethers.formatEther(amountIn)} ETH for tokens ===`));
    console.log(`Fee tier: ${fee / 10000}%`);
    
    const router = new ethers.Contract(this.network.contracts.uniswapV3Router, SWAP_ROUTER_ABI, this.wallet);
    
    const params = {
      tokenIn: this.network.contracts.WETH,
      tokenOut: tokenOut,
      fee: fee,
      recipient: this.wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    
    try {
      const tx = await router.exactInputSingle(params, { value: amountIn });
      console.log(chalk.green(`✓ V3 Swap initiated: ${tx.hash}`));
      const receipt = await tx.wait();
      console.log(chalk.green(`✓ Swap confirmed!`));
      
      return receipt;
    } catch (error) {
      // Try different fee tiers
      if (error.message.includes('revert') && fee === 3000) {
        console.log(chalk.yellow('Trying different fee tier (0.05%)...'));
        return await this.swapETHForTokens(tokenOut, amountIn, 500, slippage);
      }
      throw error;
    }
  }

  async tryMultipleFees(swapFunction, ...args) {
    const feeTiers = [3000, 10000, 500, 100]; // 0.3%, 1%, 0.05%, 0.01%
    
    for (const fee of feeTiers) {
      try {
        console.log(chalk.yellow(`Trying fee tier: ${fee / 10000}%`));
        const newArgs = [...args];
        newArgs[2] = fee; // fee is the third argument
        return await swapFunction.apply(this, newArgs);
      } catch (error) {
        console.log(chalk.red(`Failed with ${fee / 10000}% fee tier`));
        if (fee === feeTiers[feeTiers.length - 1]) {
          throw error; // Re-throw on last attempt
        }
      }
    }
  }

  async displayBalances() {
    console.log(chalk.cyan(`\n=== Account Balances on ${this.network.name} ===`));
    console.log(`Address: ${this.wallet.address}`);
    
    // ETH balance
    const ethBalance = await this.provider.getBalance(this.wallet.address);
    console.log(`${this.network.currency}: ${ethers.formatEther(ethBalance)}`);
    
    // Token balances
    const tokens = [
      { address: this.network.contracts.WETH, name: 'WETH' },
      { address: this.network.contracts.USDC, name: 'USDC' },
    ];
    
    if (this.network.contracts.USDT) {
      tokens.push({ address: this.network.contracts.USDT, name: 'USDT' });
    }
    
    if (this.network.contracts.WMATIC) {
      tokens.push({ address: this.network.contracts.WMATIC, name: 'WMATIC' });
    }
    
    for (const token of tokens) {
      if (token.address) {
        try {
          const info = await this.getTokenInfo(token.address);
          console.log(`${info.symbol}: ${ethers.formatUnits(info.balance, info.decimals)}`);
        } catch (error) {
          console.log(`${token.name}: Error reading balance`);
        }
      }
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node swap-v3.js <network> [action] [params]'));
    console.log('Networks: sepolia, arbitrumSepolia, baseSepolia, polygonAmoy');
    console.log('Actions: balances, swapUSDCToETH, swapETHToUSDC, tryAllFees');
    console.log('Example: node swap-v3.js arbitrumSepolia swapUSDCToETH 1');
    return;
  }
  
  const [network, action = 'balances', ...params] = args;
  
  try {
    const swapper = new SwapV3Tester(network);
    
    switch (action) {
      case 'balances':
        await swapper.displayBalances();
        break;
        
      case 'swapUSDCToETH':
        const usdcAmount = params[0] || '1';
        const fee = params[1] || '3000';
        await swapper.swapTokensForETH(
          swapper.network.contracts.USDC,
          ethers.parseUnits(usdcAmount, 6),
          parseInt(fee)
        );
        await swapper.displayBalances();
        break;
        
      case 'swapETHToUSDC':
        const ethAmount = params[0] || '0.001';
        const ethFee = params[1] || '3000';
        await swapper.swapETHForTokens(
          swapper.network.contracts.USDC,
          ethers.parseEther(ethAmount),
          parseInt(ethFee)
        );
        await swapper.displayBalances();
        break;
        
      case 'tryAllFees':
        const amount = params[0] || '1';
        await swapper.tryMultipleFees(
          swapper.swapTokensForETH,
          swapper.network.contracts.USDC,
          ethers.parseUnits(amount, 6)
        );
        await swapper.displayBalances();
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

module.exports = { SwapV3Tester };