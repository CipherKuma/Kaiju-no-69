const { ethers } = require('ethers');
const chalk = require('chalk');
const { getWallet, getNetwork } = require('../config');

// Uniswap V2 Router ABI
const UNISWAP_V2_ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"
];

// Uniswap V2 Factory ABI
const UNISWAP_V2_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)"
];

// Uniswap V3 Position Manager ABI
const POSITION_MANAGER_ABI = [
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

// LP Token ABI
const LP_TOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function totalSupply() external view returns (uint256)"
];

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class LiquidityTester {
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

  async getPairAddress(tokenA, tokenB) {
    const factory = new ethers.Contract(this.network.contracts.uniswapV2Factory, UNISWAP_V2_FACTORY_ABI, this.provider);
    return await factory.getPair(tokenA, tokenB);
  }

  async addLiquidityETHV2(token, tokenAmount, ethAmount, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Adding Liquidity to ETH/${token} Pool (V2) ===`));
    
    const tokenInfo = await this.getTokenInfo(token);
    console.log(`Adding ${ethers.formatEther(ethAmount)} ETH + ${ethers.formatUnits(tokenAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    
    // Approve tokens
    await this.approveToken(token, this.network.contracts.uniswapV2Router, tokenAmount);
    
    const router = new ethers.Contract(this.network.contracts.uniswapV2Router, UNISWAP_V2_ROUTER_ABI, this.wallet);
    
    const amountTokenMin = tokenAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    const amountETHMin = ethAmount * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.addLiquidityETH(
      token,
      tokenAmount,
      amountTokenMin,
      amountETHMin,
      this.wallet.address,
      deadline,
      { value: ethAmount }
    );
    
    console.log(chalk.green(`✓ Liquidity added: ${tx.hash}`));
    const receipt = await tx.wait();
    
    return receipt;
  }

  async removeLiquidityETHV2(token, lpTokenAmount, slippage = 0.5) {
    console.log(chalk.blue(`\n=== Removing Liquidity from ETH/${token} Pool (V2) ===`));
    
    // Get pair address
    const pairAddress = await this.getPairAddress(this.network.contracts.WETH, token);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Pair does not exist');
    }
    
    // Approve LP tokens
    await this.approveToken(pairAddress, this.network.contracts.uniswapV2Router, lpTokenAmount);
    
    const router = new ethers.Contract(this.network.contracts.uniswapV2Router, UNISWAP_V2_ROUTER_ABI, this.wallet);
    
    const amountTokenMin = 0; // Set to 0 for testing, use proper calculation in production
    const amountETHMin = 0;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.removeLiquidityETH(
      token,
      lpTokenAmount,
      amountTokenMin,
      amountETHMin,
      this.wallet.address,
      deadline
    );
    
    console.log(chalk.green(`✓ Liquidity removed: ${tx.hash}`));
    const receipt = await tx.wait();
    
    return receipt;
  }

  async mintPositionV3(token0, token1, fee, amount0, amount1, tickLower = -887220, tickUpper = 887220) {
    console.log(chalk.blue(`\n=== Minting V3 Position ===`));
    
    if (!this.network.contracts.nonfungiblePositionManager) {
      throw new Error(`Uniswap V3 not available on ${this.networkName}`);
    }
    
    // Approve tokens
    await this.approveToken(token0, this.network.contracts.nonfungiblePositionManager, amount0);
    await this.approveToken(token1, this.network.contracts.nonfungiblePositionManager, amount1);
    
    const positionManager = new ethers.Contract(
      this.network.contracts.nonfungiblePositionManager,
      POSITION_MANAGER_ABI,
      this.wallet
    );
    
    const params = {
      token0: token0,
      token1: token1,
      fee: fee, // 500, 3000, or 10000
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: 0,
      amount1Min: 0,
      recipient: this.wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20
    };
    
    const tx = await positionManager.mint(params);
    console.log(chalk.green(`✓ V3 Position minted: ${tx.hash}`));
    const receipt = await tx.wait();
    
    // Extract token ID from events
    const mintEvent = receipt.logs.find(log => {
      try {
        const decoded = positionManager.interface.parseLog(log);
        return decoded.name === 'IncreaseLiquidity';
      } catch (e) {
        return false;
      }
    });
    
    return receipt;
  }

  async getLPTokenBalance(tokenA, tokenB) {
    const pairAddress = await this.getPairAddress(tokenA, tokenB);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return BigInt(0);
    }
    
    const lpToken = new ethers.Contract(pairAddress, LP_TOKEN_ABI, this.provider);
    return await lpToken.balanceOf(this.wallet.address);
  }

  async displayLiquidityPositions() {
    console.log(chalk.cyan(`\n=== Liquidity Positions on ${this.network.name} ===`));
    console.log(`Address: ${this.wallet.address}`);
    
    // Check LP token balances for major pairs
    const pairs = [
      { tokenA: this.network.contracts.WETH, tokenB: this.network.contracts.USDC, name: 'ETH/USDC' }
    ];
    
    if (this.network.contracts.USDT) {
      pairs.push({ tokenA: this.network.contracts.WETH, tokenB: this.network.contracts.USDT, name: 'ETH/USDT' });
      pairs.push({ tokenA: this.network.contracts.USDC, tokenB: this.network.contracts.USDT, name: 'USDC/USDT' });
    }
    
    for (const pair of pairs) {
      try {
        const lpBalance = await this.getLPTokenBalance(pair.tokenA, pair.tokenB);
        if (lpBalance > 0) {
          console.log(`${pair.name} LP: ${ethers.formatEther(lpBalance)}`);
        } else {
          console.log(`${pair.name} LP: 0`);
        }
      } catch (error) {
        console.log(`${pair.name} LP: Error reading balance`);
      }
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node liquidity.js <network> [action] [params]'));
    console.log('Networks: sepolia, arbitrumSepolia, baseSepolia, polygonAmoy');
    console.log('Actions: positions, addETHUSDC, removeETHUSDC');
    console.log('Example: node liquidity.js sepolia positions');
    console.log('Example: node liquidity.js sepolia addETHUSDC 0.01 10');
    return;
  }
  
  const [network, action = 'positions', ...params] = args;
  
  try {
    const liquidityTester = new LiquidityTester(network);
    
    switch (action) {
      case 'positions':
        await liquidityTester.displayLiquidityPositions();
        break;
        
      case 'addETHUSDC':
        const ethAmount = params[0] || '0.001';
        const usdcAmount = params[1] || '1';
        await liquidityTester.addLiquidityETHV2(
          liquidityTester.network.contracts.USDC,
          ethers.parseUnits(usdcAmount, 6),
          ethers.parseEther(ethAmount)
        );
        await liquidityTester.displayLiquidityPositions();
        break;
        
      case 'removeETHUSDC':
        const lpAmount = params[0] || '0.001';
        await liquidityTester.removeLiquidityETHV2(
          liquidityTester.network.contracts.USDC,
          ethers.parseEther(lpAmount)
        );
        await liquidityTester.displayLiquidityPositions();
        break;
        
      case 'mintV3':
        const eth = params[0] || '0.001';
        const usdc = params[1] || '1';
        const fee = params[2] || '3000';
        await liquidityTester.mintPositionV3(
          liquidityTester.network.contracts.WETH,
          liquidityTester.network.contracts.USDC,
          parseInt(fee),
          ethers.parseEther(eth),
          ethers.parseUnits(usdc, 6)
        );
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

module.exports = { LiquidityTester };