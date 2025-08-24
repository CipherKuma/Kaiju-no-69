const { ethers } = require('ethers');
const chalk = require('chalk');
const { getWallet, getNetwork } = require('../config');

// Uniswap V2 Router ABI (simplified)
const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

// Uniswap V3 Router ABI (simplified)
const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

// ERC20 ABI (simplified)
const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class SwapTester {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
    this.wallet = getWallet(networkName);
    this.provider = this.wallet.provider;
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

  async swapETHForTokensV2(tokenOut, amountIn, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Uniswap V2: Swapping ${ethers.formatEther(amountIn)} ETH for ${tokenOut} ===`));
    
    const router = new ethers.Contract(this.network.contracts.uniswapV2Router, UNISWAP_V2_ROUTER_ABI, this.wallet);
    const path = [this.network.contracts.WETH, tokenOut];
    
    // Get expected output
    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOut = amounts[1];
    const amountOutMin = amountOut * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    
    console.log(`Expected output: ${ethers.formatUnits(amountOut, 6)} tokens`);
    console.log(`Minimum output: ${ethers.formatUnits(amountOutMin, 6)} tokens`);
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      this.wallet.address,
      deadline,
      { value: amountIn }
    );
    
    console.log(chalk.green(`✓ Swap successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async swapTokensForETHV2(tokenIn, amountIn, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Uniswap V2: Swapping tokens for ETH ===`));
    
    const tokenInfo = await this.getTokenInfo(tokenIn);
    console.log(`Swapping ${ethers.formatUnits(amountIn, tokenInfo.decimals)} ${tokenInfo.symbol} for ETH`);
    
    // Approve tokens
    await this.approveToken(tokenIn, this.network.contracts.uniswapV2Router, amountIn);
    
    const router = new ethers.Contract(this.network.contracts.uniswapV2Router, UNISWAP_V2_ROUTER_ABI, this.wallet);
    const path = [tokenIn, this.network.contracts.WETH];
    
    // Get expected output
    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOut = amounts[1];
    const amountOutMin = amountOut * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    
    console.log(`Expected output: ${ethers.formatEther(amountOut)} ETH`);
    console.log(`Minimum output: ${ethers.formatEther(amountOutMin)} ETH`);
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      this.wallet.address,
      deadline
    );
    
    console.log(chalk.green(`✓ Swap successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
  }

  async swapETHForTokensV3(tokenOut, amountIn, fee = 3000, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Uniswap V3: Swapping ${ethers.formatEther(amountIn)} ETH for tokens ===`));
    
    if (!this.network.contracts.uniswapV3Router) {
      throw new Error(`Uniswap V3 not available on ${this.networkName}`);
    }
    
    const router = new ethers.Contract(this.network.contracts.uniswapV3Router, UNISWAP_V3_ROUTER_ABI, this.wallet);
    
    const params = {
      tokenIn: this.network.contracts.WETH,
      tokenOut: tokenOut,
      fee: fee, // 0.3% = 3000, 0.05% = 500, 1% = 10000
      recipient: this.wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountIn,
      amountOutMinimum: 0, // Calculate this based on slippage in production
      sqrtPriceLimitX96: 0
    };
    
    const tx = await router.exactInputSingle(params, { value: amountIn });
    console.log(chalk.green(`✓ V3 Swap successful: ${tx.hash}`));
    await tx.wait();
    
    return tx;
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
    console.log(chalk.red('Usage: node swap.js <network> [action] [params]'));
    console.log('Networks: sepolia, arbitrumSepolia, baseSepolia, polygonAmoy');
    console.log('Actions: balances, swapETHToUSDC, swapUSDCToETH');
    console.log('Example: node swap.js sepolia balances');
    console.log('Example: node swap.js sepolia swapETHToUSDC 0.01');
    return;
  }
  
  const [network, action = 'balances', ...params] = args;
  
  try {
    const swapper = new SwapTester(network);
    
    switch (action) {
      case 'balances':
        await swapper.displayBalances();
        break;
        
      case 'swapETHToUSDC':
        const ethAmount = params[0] || '0.001';
        await swapper.swapETHForTokensV2(
          swapper.network.contracts.USDC,
          ethers.parseEther(ethAmount)
        );
        await swapper.displayBalances();
        break;
        
      case 'swapUSDCToETH':
        const usdcAmount = params[0] || '1';
        await swapper.swapTokensForETHV2(
          swapper.network.contracts.USDC,
          ethers.parseUnits(usdcAmount, 6)
        );
        await swapper.displayBalances();
        break;
        
      case 'swapETHToUSDCV3':
        const ethAmountV3 = params[0] || '0.001';
        await swapper.swapETHForTokensV3(
          swapper.network.contracts.USDC,
          ethers.parseEther(ethAmountV3)
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

module.exports = { SwapTester };