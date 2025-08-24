import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { TradingSignal } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract ABIs
const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"
];

const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

const PERPETUAL_EXCHANGE_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function openPosition(string memory asset, bool isLong, uint256 collateral, uint256 leverage) external returns (uint256)",
  "function closePosition(uint256 positionId) external",
  "function getPosition(uint256 positionId) external view returns (tuple(address trader, string asset, bool isLong, uint256 size, uint256 collateral, uint256 entryPrice, uint256 openTimestamp, bool isActive))",
  "function getPositionPnL(uint256 positionId) external view returns (int256 pnl, uint256 fees)",
  "function getUserAccount(address user) external view returns (tuple(uint256 totalCollateral, uint256 usedCollateral, uint256[] positionIds))"
];

const PRICE_ORACLE_ABI = [
  "function getLatestPrice(string memory asset) external view returns (uint256)"
];

interface DeFiConfig {
  privateKey: string;
  rpcUrl: string;
  contracts: {
    [key: string]: string | undefined;
    WETH: string;
    USDC: string;
    USDT: string;
    DAI: string;
    LINK: string;
    SHAPE: string;
    uniswapV2Router: string;
    perpetualExchange?: string;
    priceOracle?: string;
  };
}

export class DeFiExecutor {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private contracts: DeFiConfig['contracts'];
  private router: ethers.Contract;
  private perpExchange?: ethers.Contract;
  private priceOracle?: ethers.Contract;
  
  constructor(privateKey: string) {
    // Shape Sepolia configuration
    const rpcUrl = process.env.SHAPE_SEPOLIA_RPC || 'https://sepolia.shape.network';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    logger.info('Connecting to Shape Sepolia', { rpcUrl });
    
    // Load Shape Sepolia contracts
    const shapeDeployments = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../testing-trading/deployments/shapeSepolia.json'), 'utf8')
    );
    
    this.contracts = shapeDeployments;
    
    // Initialize Uniswap V2 Router
    this.router = new ethers.Contract(
      this.contracts.uniswapV2Router,
      UNISWAP_V2_ROUTER_ABI,
      this.wallet
    );
    
    // Load perps contracts if available
    const perpsPath = path.join(__dirname, '../../../testing-trading/deployments/shapeSepolia-perps.json');
    if (fs.existsSync(perpsPath)) {
      const perpsDeployments = JSON.parse(fs.readFileSync(perpsPath, 'utf8'));
      this.perpExchange = new ethers.Contract(
        perpsDeployments.perpetualExchange,
        PERPETUAL_EXCHANGE_ABI,
        this.wallet
      );
      this.priceOracle = new ethers.Contract(
        perpsDeployments.priceOracle,
        PRICE_ORACLE_ABI,
        this.wallet
      );
    }
    
    logger.info('DeFi Executor initialized for Shape Sepolia', {
      address: this.wallet.address,
      router: this.contracts.uniswapV2Router
    });
  }
  
  async getBalances(): Promise<{[token: string]: { balance: string, decimals: number, symbol: string }}> {
    const balances: any = {};
    
    // Get ETH balance
    const ethBalance = await this.provider.getBalance(this.wallet.address);
    balances['ETH'] = {
      balance: ethers.formatEther(ethBalance),
      decimals: 18,
      symbol: 'ETH'
    };
    
    // Get token balances
    const tokens = ['WETH', 'USDC', 'USDT', 'DAI', 'LINK', 'SHAPE'];
    
    for (const tokenName of tokens) {
      if (this.contracts[tokenName]) {
        try {
          const token = new ethers.Contract(this.contracts[tokenName], ERC20_ABI, this.provider);
          const [balance, decimals, symbol] = await Promise.all([
            token.balanceOf(this.wallet.address),
            token.decimals(),
            token.symbol()
          ]);
          
          balances[tokenName] = {
            balance: ethers.formatUnits(balance, decimals),
            decimals: Number(decimals),
            symbol
          };
        } catch (error) {
          logger.error(`Error getting balance for ${tokenName}`, { error });
        }
      }
    }
    
    return balances;
  }
  
  async executeSpotTrade(signal: TradingSignal): Promise<any> {
    try {
      logger.info('Executing spot trade on Shape Sepolia', { signal });
      
      // Map trading pairs to tokens
      const tokenMap: { [key: string]: { base: string; quote: string } } = {
        'BTC/USDT': { base: 'WETH', quote: 'USDT' }, // Using WETH as proxy for BTC
        'ETH/USDT': { base: 'WETH', quote: 'USDT' },
        'ETH/USDC': { base: 'WETH', quote: 'USDC' },
        'SOL/USDT': { base: 'SHAPE', quote: 'USDT' }, // Using SHAPE as proxy for SOL
        'LINK/USDT': { base: 'LINK', quote: 'USDT' }
      };
      
      const pair = tokenMap[signal.symbol];
      if (!pair) {
        throw new Error(`Unsupported trading pair: ${signal.symbol}`);
      }
      
      const baseToken = this.contracts[pair.base];
      const quoteToken = this.contracts[pair.quote];
      
      if (!baseToken || !quoteToken) {
        throw new Error(`Token addresses not found for pair: ${signal.symbol}`);
      }
      
      // Calculate trade amount based on position size
      const balances = await this.getBalances();
      const portfolioValue = await this.calculatePortfolioValue(balances);
      const tradeValueUSD = portfolioValue * (signal.positionSize || 0.1);
      
      if (signal.action === 'BUY') {
        // Buy base token with quote token
        if (pair.base === 'WETH') {
          // Use ETH directly for WETH trades
          return await this.swapETHForTokens(quoteToken, tradeValueUSD);
        } else {
          // Swap tokens
          return await this.swapTokensForTokens(quoteToken, baseToken, tradeValueUSD);
        }
      } else if (signal.action === 'SELL') {
        // Sell base token for quote token
        if (pair.base === 'WETH') {
          // Swap WETH for tokens
          return await this.swapTokensForETH(quoteToken, tradeValueUSD);
        } else {
          // Swap tokens
          return await this.swapTokensForTokens(baseToken, quoteToken, tradeValueUSD);
        }
      }
      
    } catch (error) {
      logger.error('Error executing spot trade', { error, signal });
      throw error;
    }
  }
  
  async executePerpetualTrade(signal: TradingSignal): Promise<any> {
    if (!this.perpExchange) {
      throw new Error('Perpetual exchange not available');
    }
    
    try {
      logger.info('Executing perpetual trade on Shape Sepolia', { signal });
      
      // Map trading symbols to perp assets
      const assetMap: { [key: string]: string } = {
        'BTC/USDT': 'BTC',
        'ETH/USDT': 'ETH',
        'SOL/USDT': 'SOL'
      };
      
      const asset = assetMap[signal.symbol];
      if (!asset) {
        throw new Error(`Unsupported perpetual asset: ${signal.symbol}`);
      }
      
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        // Check account collateral
        const account = await this.perpExchange.getUserAccount(this.wallet.address);
        const totalCollateral = BigInt(account.totalCollateral.toString());
        const usedCollateral = BigInt(account.usedCollateral.toString());
        const availableCollateral = totalCollateral - usedCollateral;
        
        if (availableCollateral <= 0n) {
          logger.warn('No available collateral for perps trading');
          return null;
        }
        
        // Calculate position size
        const collateralAmount = availableCollateral * BigInt(Math.floor((signal.positionSize || 0.1) * 100)) / BigInt(100);
        const leverage = signal.leverage || 5;
        
        // Open position
        const isLong = signal.action === 'BUY';
        const tx = await this.perpExchange.openPosition(asset, isLong, collateralAmount, leverage);
        const receipt = await tx.wait();
        
        // Extract position ID from events
        const event = receipt.logs.find((log: any) => {
          try {
            const decoded = this.perpExchange!.interface.parseLog(log);
            return decoded.name === 'PositionOpened';
          } catch {
            return false;
          }
        });
        
        if (event) {
          const decoded = this.perpExchange.interface.parseLog(event);
          return {
            positionId: decoded.args.positionId.toString(),
            asset,
            side: isLong ? 'LONG' : 'SHORT',
            collateral: ethers.formatUnits(collateralAmount, 6),
            leverage,
            txHash: receipt.hash
          };
        }
      } else if (signal.action === 'CLOSE') {
        // Close existing positions for this asset
        const account = await this.perpExchange.getUserAccount(this.wallet.address);
        
        for (const positionId of account.positionIds) {
          const position = await this.perpExchange.getPosition(positionId);
          if (position.asset === asset && position.isActive) {
            const tx = await this.perpExchange.closePosition(positionId);
            await tx.wait();
            
            return {
              action: 'CLOSE',
              positionId: positionId.toString(),
              txHash: tx.hash
            };
          }
        }
      }
      
    } catch (error) {
      logger.error('Error executing perpetual trade', { error, signal });
      throw error;
    }
  }
  
  private async swapETHForTokens(tokenOut: string, amountInUSD: number): Promise<any> {
    const ethPrice = 2500; // Approximate ETH price
    const amountIn = ethers.parseEther((amountInUSD / ethPrice).toFixed(6));
    
    const path = [this.contracts.WETH, tokenOut];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // Get expected output
    const amounts = await this.router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage
    
    const tx = await this.router.swapExactETHForTokens(
      amountOutMin,
      path,
      this.wallet.address,
      deadline,
      { value: amountIn }
    );
    
    const receipt = await tx.wait();
    
    return {
      action: 'SWAP',
      tokenIn: 'ETH',
      tokenOut,
      amountIn: ethers.formatEther(amountIn),
      expectedOut: ethers.formatUnits(amounts[1], 6),
      txHash: receipt.hash
    };
  }
  
  private async swapTokensForETH(tokenIn: string, amountInUSD: number): Promise<any> {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, this.wallet);
    const decimals = await token.decimals();
    const balance = await token.balanceOf(this.wallet.address);
    
    // Calculate amount based on USD value (assuming stable coins)
    const amountIn = ethers.parseUnits(amountInUSD.toFixed(2), decimals);
    
    if (balance < amountIn) {
      throw new Error('Insufficient token balance');
    }
    
    // Approve router
    const approveTx = await token.approve(this.contracts.uniswapV2Router, amountIn);
    await approveTx.wait();
    
    const path = [tokenIn, this.contracts.WETH];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // Get expected output
    const amounts = await this.router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage
    
    const tx = await this.router.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      this.wallet.address,
      deadline
    );
    
    const receipt = await tx.wait();
    
    return {
      action: 'SWAP',
      tokenIn,
      tokenOut: 'ETH',
      amountIn: ethers.formatUnits(amountIn, decimals),
      expectedOut: ethers.formatEther(amounts[1]),
      txHash: receipt.hash
    };
  }
  
  private async swapTokensForTokens(tokenIn: string, tokenOut: string, amountInUSD: number): Promise<any> {
    const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, this.wallet);
    const decimalsIn = await tokenInContract.decimals();
    const balance = await tokenInContract.balanceOf(this.wallet.address);
    
    // Calculate amount based on USD value
    const amountIn = ethers.parseUnits(amountInUSD.toFixed(2), decimalsIn);
    
    if (balance < amountIn) {
      throw new Error('Insufficient token balance');
    }
    
    // Approve router
    const approveTx = await tokenInContract.approve(this.contracts.uniswapV2Router, amountIn);
    await approveTx.wait();
    
    const path = [tokenIn, this.contracts.WETH, tokenOut]; // Route through WETH
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // Get expected output
    const amounts = await this.router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[amounts.length - 1] * 95n / 100n; // 5% slippage
    
    const tx = await this.router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      this.wallet.address,
      deadline
    );
    
    const receipt = await tx.wait();
    
    return {
      action: 'SWAP',
      tokenIn,
      tokenOut,
      amountIn: ethers.formatUnits(amountIn, decimalsIn),
      expectedOut: ethers.formatUnits(amounts[amounts.length - 1], 6),
      txHash: receipt.hash
    };
  }
  
  private async calculatePortfolioValue(balances: any): Promise<number> {
    // Simple calculation assuming stable coins = $1 and ETH = $2500
    const prices: { [key: string]: number } = {
      ETH: 2500,
      WETH: 2500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      LINK: 15,
      SHAPE: 0.1
    };
    
    let totalValue = 0;
    
    for (const [token, data] of Object.entries(balances)) {
      const price = prices[token] || 0;
      const balance = parseFloat((data as any).balance);
      totalValue += balance * price;
    }
    
    return totalValue;
  }
  
  async addLiquidity(tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<any> {
    try {
      logger.info('Adding liquidity on Shape Sepolia', { tokenA, tokenB, amountA, amountB });
      
      const tokenAAddress = this.contracts[tokenA];
      const tokenBAddress = this.contracts[tokenB];
      
      if (!tokenAAddress || !tokenBAddress) {
        throw new Error('Invalid token names');
      }
      
      if (tokenA === 'WETH' || tokenB === 'WETH') {
        // Handle ETH liquidity
        const token = tokenA === 'WETH' ? tokenBAddress : tokenAAddress;
        const tokenAmount = tokenA === 'WETH' ? amountB : amountA;
        const ethAmount = tokenA === 'WETH' ? amountA : amountB;
        
        // Approve token
        const tokenContract = new ethers.Contract(token, ERC20_ABI, this.wallet);
        const decimals = await tokenContract.decimals();
        const amountWei = ethers.parseUnits(tokenAmount, decimals);
        
        const approveTx = await tokenContract.approve(this.contracts.uniswapV2Router, amountWei);
        await approveTx.wait();
        
        // Add liquidity
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const tx = await this.router.addLiquidityETH(
          token,
          amountWei,
          amountWei * 95n / 100n, // 5% slippage
          ethers.parseEther(ethAmount) * 95n / 100n,
          this.wallet.address,
          deadline,
          { value: ethers.parseEther(ethAmount) }
        );
        
        const receipt = await tx.wait();
        
        return {
          action: 'ADD_LIQUIDITY',
          pair: `${tokenA}/${tokenB}`,
          amounts: { [tokenA]: amountA, [tokenB]: amountB },
          txHash: receipt.hash
        };
      } else {
        throw new Error('Token-to-token liquidity not implemented yet');
      }
      
    } catch (error) {
      logger.error('Error adding liquidity', { error });
      throw error;
    }
  }
  
  async getAccountStatus(): Promise<any> {
    const balances = await this.getBalances();
    const portfolioValue = await this.calculatePortfolioValue(balances);
    
    let perpAccount = null;
    if (this.perpExchange) {
      try {
        const account = await this.perpExchange.getUserAccount(this.wallet.address);
        perpAccount = {
          totalCollateral: ethers.formatUnits(account.totalCollateral, 6),
          usedCollateral: ethers.formatUnits(account.usedCollateral, 6),
          availableCollateral: ethers.formatUnits(account.totalCollateral - account.usedCollateral, 6),
          positionCount: account.positionIds.length
        };
      } catch (error) {
        logger.error('Error getting perp account', { error });
      }
    }
    
    return {
      address: this.wallet.address,
      network: 'Shape Sepolia',
      balances,
      portfolioValue,
      perpAccount
    };
  }
}