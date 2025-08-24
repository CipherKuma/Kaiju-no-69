import { KaijuServiceClient } from '../api/KaijuServiceClient';
import { KAIJU_CONFIG } from '../config/kaijuConfig';
import { logger } from '../utils/logger';
import { ethers } from 'ethers';

// Token addresses on Shape Sepolia
const TOKENS = {
  WETH: '0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489',
  USDC: '0x183F03D0e64d75fe62b5cb0F8c330A1707F15d3A',
  USDT: '0x28e9112381A9c4Da0B98a0A3F65af704bd7DaAc0',
  DAI: '0xB0FC35262d8383bE97b90D01b3F5572007E7A10E',
  LINK: '0x83B085E9F68757972279826612553D398FD24C8b',
  SHAPE: '0x92F84329447e08bc02470A583f4c558E5f6BF05c'
};

export interface MarketSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  asset: string;
  reason: string;
}

export class KaijuIntegratedStrategy {
  private kaijuClient: KaijuServiceClient;
  private activeTradeIds: Set<string> = new Set();
  
  constructor() {
    this.kaijuClient = new KaijuServiceClient(
      KAIJU_CONFIG.SERVICE_URL,
      KAIJU_CONFIG.KAIJU_ID,
      KAIJU_CONFIG.ALGORITHM_KEY
    );
  }

  /**
   * Initialize the strategy
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Kaiju Integrated Strategy');
    
    // Load active trades from Kaiju service
    const activeTrades = await this.kaijuClient.getActiveTrades();
    activeTrades.forEach(trade => this.activeTradeIds.add(trade.id));
    
    logger.info(`Loaded ${activeTrades.length} active trades`);
  }

  /**
   * Example: Simple moving average crossover strategy
   */
  async analyzeMarket(priceData: number[]): Promise<MarketSignal> {
    // Simple SMA calculation (in production, use proper technical indicators)
    const shortPeriod = 20;
    const longPeriod = 50;
    
    if (priceData.length < longPeriod) {
      return { type: 'HOLD', confidence: 0, asset: 'WETH', reason: 'Insufficient data' };
    }
    
    const shortSMA = this.calculateSMA(priceData.slice(-shortPeriod));
    const longSMA = this.calculateSMA(priceData.slice(-longPeriod));
    const currentPrice = priceData[priceData.length - 1];
    
    // Calculate confidence based on the strength of the signal
    const crossoverStrength = Math.abs(shortSMA - longSMA) / longSMA * 100;
    const confidence = Math.min(90, 50 + crossoverStrength * 10);
    
    if (shortSMA > longSMA && currentPrice > shortSMA) {
      return {
        type: 'BUY',
        confidence,
        asset: 'WETH',
        reason: `Bullish SMA crossover: Short SMA (${shortSMA.toFixed(2)}) > Long SMA (${longSMA.toFixed(2)})`
      };
    } else if (shortSMA < longSMA && currentPrice < shortSMA) {
      return {
        type: 'SELL',
        confidence,
        asset: 'WETH',
        reason: `Bearish SMA crossover: Short SMA (${shortSMA.toFixed(2)}) < Long SMA (${longSMA.toFixed(2)})`
      };
    }
    
    return {
      type: 'HOLD',
      confidence: 30,
      asset: 'WETH',
      reason: 'No clear trend signal'
    };
  }

  /**
   * Execute a trade based on market signal
   */
  async executeTrade(signal: MarketSignal): Promise<void> {
    // Check if we should execute based on confidence
    if (signal.confidence < KAIJU_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      logger.info(`Signal confidence (${signal.confidence}%) below threshold, skipping trade`);
      return;
    }
    
    // Check max open positions
    if (this.activeTradeIds.size >= KAIJU_CONFIG.MAX_OPEN_POSITIONS) {
      logger.warn('Maximum open positions reached, skipping trade');
      return;
    }
    
    try {
      if (signal.type === 'BUY') {
        await this.executeBuyTrade(signal);
      } else if (signal.type === 'SELL') {
        await this.executeSellTrade(signal);
      }
    } catch (error) {
      logger.error('Failed to execute trade:', error);
    }
  }

  /**
   * Execute a buy trade (USDC -> WETH)
   */
  private async executeBuyTrade(signal: MarketSignal): Promise<void> {
    const amountIn = ethers.parseUnits('100', 6); // 100 USDC
    const minAmountOut = ethers.parseUnits('0.04', 18); // Minimum 0.04 WETH (slippage protection)
    
    const tradeData = this.kaijuClient.createSwapTradeData(
      TOKENS.USDC,
      TOKENS.WETH,
      amountIn.toString(),
      minAmountOut.toString(),
      signal.confidence
    );
    
    logger.info(`Executing BUY trade: ${signal.reason}`);
    
    const result = await this.kaijuClient.postTrade({
      tradeType: tradeData.tradeType,
      confidenceLevel: tradeData.confidenceLevel,
      entryData: tradeData.entryData
    });
    
    this.activeTradeIds.add(result.tradeId);
    logger.info(`Trade posted successfully: ${result.tradeId}, affecting ${result.shadowCount} shadows`);
  }

  /**
   * Execute a sell trade (WETH -> USDC)
   */
  private async executeSellTrade(signal: MarketSignal): Promise<void> {
    // Check if we have any WETH positions to sell
    const activeTrades = await this.kaijuClient.getActiveTrades();
    const wethPosition = activeTrades.find(
      trade => trade.tradeType === 'swap' && 
      trade.entryData.data.tokenOut === TOKENS.WETH
    );
    
    if (!wethPosition) {
      logger.info('No WETH position to sell');
      return;
    }
    
    const amountIn = ethers.parseUnits('0.05', 18); // Sell 0.05 WETH
    const minAmountOut = ethers.parseUnits('100', 6); // Minimum 100 USDC
    
    const tradeData = this.kaijuClient.createSwapTradeData(
      TOKENS.WETH,
      TOKENS.USDC,
      amountIn.toString(),
      minAmountOut.toString(),
      signal.confidence
    );
    
    logger.info(`Executing SELL trade: ${signal.reason}`);
    
    // Close the existing position
    await this.kaijuClient.closeTrade(wethPosition.id, {
      tokenIn: TOKENS.WETH,
      tokenOut: TOKENS.USDC,
      amountIn: amountIn.toString(),
      minAmountOut: minAmountOut.toString()
    });
    
    this.activeTradeIds.delete(wethPosition.id);
    logger.info(`Position ${wethPosition.id} closed successfully`);
  }

  /**
   * Monitor and manage active positions
   */
  async monitorPositions(): Promise<void> {
    const activeTrades = await this.kaijuClient.getActiveTrades();
    
    for (const trade of activeTrades) {
      // Example: Close positions based on time or profit targets
      const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tradeAge > maxAge) {
        logger.info(`Closing aged position ${trade.id}`);
        await this.kaijuClient.closeTrade(trade.id);
        this.activeTradeIds.delete(trade.id);
      }
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[]): number {
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }

  /**
   * Main strategy loop
   */
  async run(): Promise<void> {
    logger.info('Starting Kaiju Integrated Strategy');
    
    // Initialize
    await this.initialize();
    
    // Market analysis loop
    setInterval(async () => {
      try {
        // In production, fetch real price data from an oracle or DEX
        const mockPriceData = this.generateMockPriceData();
        
        const signal = await this.analyzeMarket(mockPriceData);
        logger.info(`Market signal: ${signal.type} with ${signal.confidence}% confidence`);
        
        await this.executeTrade(signal);
      } catch (error) {
        logger.error('Strategy loop error:', error);
      }
    }, KAIJU_CONFIG.MARKET_ANALYSIS_INTERVAL_MS);
    
    // Position monitoring loop
    setInterval(async () => {
      try {
        await this.monitorPositions();
      } catch (error) {
        logger.error('Position monitoring error:', error);
      }
    }, KAIJU_CONFIG.POSITION_CHECK_INTERVAL_MS);
  }

  /**
   * Generate mock price data for testing
   */
  private generateMockPriceData(): number[] {
    const basePrice = 2500;
    const volatility = 50;
    const dataPoints = 100;
    
    const prices: number[] = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < dataPoints; i++) {
      const change = (Math.random() - 0.5) * volatility;
      currentPrice += change;
      prices.push(currentPrice);
    }
    
    return prices;
  }
}