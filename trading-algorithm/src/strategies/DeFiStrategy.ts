import { MarketAnalysis, TradingSignal } from '../types/index.js';
import { BaseStrategy } from './TradingStrategies.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class DeFiStrategy extends BaseStrategy {
  name = 'DeFi Opportunity Scanner';
  type: any = 'defi'; // Using 'any' to avoid type conflict
  
  async analyze(analysis: MarketAnalysis): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    
    try {
      // Extract market data
      const marketData = analysis.marketData[0];
      const indicators = analysis.technicalIndicators;
      const sentiment = analysis.sentimentData;
      
      // Strategy 1: Trend Following with DeFi optimization
      const trendSignal = this.analyzeTrendForDeFi(marketData, indicators, sentiment);
      if (trendSignal) signals.push(trendSignal);
      
      // Strategy 2: Mean Reversion for stable pairs
      if (this.isStablePair(marketData.symbol)) {
        const meanReversionSignal = this.analyzeMeanReversion(marketData, indicators);
        if (meanReversionSignal) signals.push(meanReversionSignal);
      }
      
      // Strategy 3: Volatility-based perpetual trading
      const volSignal = this.analyzeVolatilityForPerps(marketData, indicators);
      if (volSignal) signals.push(volSignal);
      
      // Strategy 4: Sentiment-driven trades
      const sentimentSignal = this.analyzeSentimentExtreme(marketData, sentiment);
      if (sentimentSignal) signals.push(sentimentSignal);
      
    } catch (error) {
      logger.error('Error in DeFi strategy analysis', { error });
    }
    
    return signals;
  }
  
  private analyzeTrendForDeFi(
    marketData: any,
    indicators: any,
    sentiment: any
  ): TradingSignal | null {
    const { rsi, macd, sma, ema, bb } = indicators;
    
    // Strong uptrend conditions for DeFi
    if (
      rsi > 50 && rsi < 70 && // Not overbought
      macd.histogram > 0 && // Positive momentum
      macd.signal > macd.macd * 0.95 && // MACD convergence
      marketData.price > sma && // Above SMA
      marketData.price > ema && // Above EMA
      sentiment.score > 0.3 // Positive sentiment
    ) {
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'BUY',
        confidence: 0.75,
        entryPrice: marketData.price,
        targetPrice: marketData.price * 1.03, // 3% target for DeFi trades
        stopLoss: marketData.price * 0.98, // 2% stop loss
        positionSize: 0.15, // 15% position for high confidence
        strategy: this.name,
        reason: 'Strong uptrend with positive sentiment - suitable for spot trade',
        timestamp: new Date(),
      };
    }
    
    // Strong downtrend conditions
    if (
      rsi < 50 && rsi > 30 && // Not oversold
      macd.histogram < 0 && // Negative momentum
      marketData.price < sma && // Below SMA
      marketData.price < ema && // Below EMA
      sentiment.score < -0.3 // Negative sentiment
    ) {
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'SELL',
        confidence: 0.7,
        entryPrice: marketData.price,
        targetPrice: marketData.price * 0.97,
        stopLoss: marketData.price * 1.02,
        positionSize: 0.1,
        strategy: this.name,
        reason: 'Strong downtrend with negative sentiment',
        timestamp: new Date(),
      };
    }
    
    return null;
  }
  
  private analyzeMeanReversion(marketData: any, indicators: any): TradingSignal | null {
    const { bb, rsi } = indicators;
    const pricePosition = (marketData.price - bb.lower) / (bb.upper - bb.lower);
    
    // Oversold conditions for stable pairs
    if (pricePosition < 0.2 && rsi < 35) {
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'BUY',
        confidence: 0.65,
        entryPrice: marketData.price,
        targetPrice: bb.middle,
        stopLoss: bb.lower * 0.99,
        positionSize: 0.2, // Larger position for stable pairs
        strategy: this.name,
        reason: 'Mean reversion opportunity - oversold stable pair',
        timestamp: new Date(),
      };
    }
    
    // Overbought conditions for stable pairs
    if (pricePosition > 0.8 && rsi > 65) {
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'SELL',
        confidence: 0.65,
        entryPrice: marketData.price,
        targetPrice: bb.middle,
        stopLoss: bb.upper * 1.01,
        positionSize: 0.2,
        strategy: this.name,
        reason: 'Mean reversion opportunity - overbought stable pair',
        timestamp: new Date(),
      };
    }
    
    return null;
  }
  
  private analyzeVolatilityForPerps(marketData: any, indicators: any): TradingSignal | null {
    const { atr, bb } = indicators;
    const volatility = atr / marketData.price;
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    
    // High volatility with clear direction - good for perps
    if (volatility > 0.02 && bbWidth > 0.04) {
      const { macd, rsi } = indicators;
      
      if (macd.histogram > 0 && rsi > 55) {
        return {
          id: uuidv4(),
          symbol: marketData.symbol,
          action: 'BUY',
          confidence: 0.7,
          entryPrice: marketData.price,
          targetPrice: marketData.price * (1 + volatility * 2), // Target based on volatility
          stopLoss: marketData.price * (1 - volatility),
          positionSize: 0.05, // Smaller size for leveraged trades
          leverage: 5, // 5x leverage for perps
          strategy: this.name,
          reason: 'High volatility with bullish momentum - perpetual long',
          timestamp: new Date(),
          tradeType: 'perpetual',
        };
      }
      
      if (macd.histogram < 0 && rsi < 45) {
        return {
          id: uuidv4(),
          symbol: marketData.symbol,
          action: 'SELL',
          confidence: 0.7,
          entryPrice: marketData.price,
          targetPrice: marketData.price * (1 - volatility * 2),
          stopLoss: marketData.price * (1 + volatility),
          positionSize: 0.05,
          leverage: 5,
          strategy: this.name,
          reason: 'High volatility with bearish momentum - perpetual short',
          timestamp: new Date(),
          tradeType: 'perpetual',
        };
      }
    }
    
    return null;
  }
  
  private analyzeSentimentExtreme(marketData: any, sentiment: any): TradingSignal | null {
    // Extreme sentiment often leads to reversals
    if (sentiment.score > 0.8) {
      // Extreme greed - potential short
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'SELL',
        confidence: 0.6,
        entryPrice: marketData.price,
        targetPrice: marketData.price * 0.95,
        stopLoss: marketData.price * 1.03,
        positionSize: 0.08,
        strategy: this.name,
        reason: 'Extreme greed detected - contrarian short',
        timestamp: new Date(),
      };
    }
    
    if (sentiment.score < -0.8) {
      // Extreme fear - potential long
      return {
        id: uuidv4(),
        symbol: marketData.symbol,
        action: 'BUY',
        confidence: 0.65,
        entryPrice: marketData.price,
        targetPrice: marketData.price * 1.05,
        stopLoss: marketData.price * 0.97,
        positionSize: 0.1,
        strategy: this.name,
        reason: 'Extreme fear detected - contrarian long',
        timestamp: new Date(),
      };
    }
    
    return null;
  }
  
  private isStablePair(symbol: string): boolean {
    const stablePairs = ['USDC/USDT', 'DAI/USDT', 'DAI/USDC'];
    return stablePairs.includes(symbol);
  }
}