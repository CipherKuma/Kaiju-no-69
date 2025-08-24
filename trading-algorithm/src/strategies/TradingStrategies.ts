import { TradingStrategy, MarketAnalysis, TradingSignal } from '../types/index.js';
import { logger } from '../utils/logger.js';

// Base Strategy Class
export abstract class BaseStrategy implements TradingStrategy {
  abstract name: string;
  abstract type: 'momentum' | 'meanReversion' | 'arbitrage' | 'sentiment' | 'combined';
  parameters: Record<string, any>;

  constructor(parameters: Record<string, any> = {}) {
    this.parameters = parameters;
  }

  abstract analyze(data: MarketAnalysis): Promise<TradingSignal[]>;

  protected createSignal(
    symbol: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    confidence: number,
    reason: string,
    additionalData?: Partial<TradingSignal>
  ): TradingSignal {
    return {
      symbol,
      action,
      confidence: Math.max(0, Math.min(1, confidence)),
      reason,
      timestamp: new Date(),
      ...additionalData,
    };
  }
}

// Momentum Strategy
export class MomentumStrategy extends BaseStrategy {
  name = 'Momentum Trading';
  type: 'momentum' = 'momentum';

  async analyze(data: MarketAnalysis): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    const { marketData, technicalIndicators } = data;

    for (const market of marketData) {
      const signal = await this.analyzeMomentum(market, technicalIndicators);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeMomentum(
    market: any,
    indicators: any
  ): Promise<TradingSignal | null> {
    const { symbol, price, change24h } = market;
    const { rsi, macd, sma20, sma50 } = indicators;

    // Strong upward momentum
    if (
      rsi > 50 && rsi < 70 && // Not overbought
      macd.histogram > 0 && // MACD bullish
      price > sma20 && sma20 > sma50 && // Price above moving averages
      change24h > 2 // Positive 24h change
    ) {
      const confidence = Math.min(
        0.9,
        (rsi - 50) / 20 + (change24h / 10) + (macd.histogram > 0 ? 0.2 : 0)
      );

      return this.createSignal(
        symbol,
        'BUY',
        confidence,
        'Strong momentum detected: Price above MAs, MACD bullish, RSI favorable',
        {
          entryPrice: price,
          targetPrice: price * 1.05, // 5% target
          stopLoss: price * 0.97, // 3% stop loss
          positionSize: 0.1,
        }
      );
    }

    // Momentum reversal (sell signal)
    if (
      rsi > 70 && // Overbought
      macd.histogram < 0 && // MACD bearish
      price < sma20 // Price below short MA
    ) {
      const confidence = Math.min(0.8, (rsi - 70) / 30 + 0.3);

      return this.createSignal(
        symbol,
        'SELL',
        confidence,
        'Momentum reversal detected: RSI overbought, MACD bearish',
        {
          entryPrice: price,
          targetPrice: price * 0.95,
          stopLoss: price * 1.02,
          positionSize: 0.1,
        }
      );
    }

    return null;
  }
}

// Mean Reversion Strategy
export class MeanReversionStrategy extends BaseStrategy {
  name = 'Mean Reversion';
  type: 'meanReversion' = 'meanReversion';

  async analyze(data: MarketAnalysis): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    const { marketData, technicalIndicators } = data;

    for (const market of marketData) {
      const signal = await this.analyzeMeanReversion(market, technicalIndicators);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeMeanReversion(
    market: any,
    indicators: any
  ): Promise<TradingSignal | null> {
    const { symbol, price } = market;
    const { rsi, bbands, atr } = indicators;

    // Price at lower Bollinger Band - potential buy
    if (
      price <= bbands.lower * 1.01 && // Near lower band
      rsi < 30 // Oversold
    ) {
      const deviation = (bbands.middle - price) / bbands.middle;
      const confidence = Math.min(0.85, deviation * 2 + (30 - rsi) / 30);

      return this.createSignal(
        symbol,
        'BUY',
        confidence,
        'Mean reversion buy: Price at lower BB, RSI oversold',
        {
          entryPrice: price,
          targetPrice: bbands.middle, // Target middle band
          stopLoss: price - 2 * atr, // 2 ATR stop loss
          positionSize: 0.08,
        }
      );
    }

    // Price at upper Bollinger Band - potential sell
    if (
      price >= bbands.upper * 0.99 && // Near upper band
      rsi > 70 // Overbought
    ) {
      const deviation = (price - bbands.middle) / bbands.middle;
      const confidence = Math.min(0.85, deviation * 2 + (rsi - 70) / 30);

      return this.createSignal(
        symbol,
        'SELL',
        confidence,
        'Mean reversion sell: Price at upper BB, RSI overbought',
        {
          entryPrice: price,
          targetPrice: bbands.middle,
          stopLoss: price + 2 * atr,
          positionSize: 0.08,
        }
      );
    }

    return null;
  }
}

// Sentiment-Based Strategy
export class SentimentStrategy extends BaseStrategy {
  name = 'Sentiment Analysis';
  type: 'sentiment' = 'sentiment';

  async analyze(data: MarketAnalysis): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    const { marketData, sentimentData, newsData } = data;

    // Analyze overall sentiment
    const sentimentSignal = this.analyzeSentiment(
      marketData[0],
      sentimentData,
      newsData
    );

    if (sentimentSignal) {
      signals.push(sentimentSignal);
    }

    return signals;
  }

  private analyzeSentiment(
    market: any,
    sentiment: any,
    news?: any[]
  ): TradingSignal | null {
    const { symbol, price } = market;
    const { score, volume, sources } = sentiment;

    // Strong positive sentiment
    if (
      score > 0.6 && // Positive sentiment
      volume > 5000 && // High mention volume
      sources.twitter > 0.5 && sources.reddit > 0.5 // Consistent across sources
    ) {
      const confidence = Math.min(0.8, score * 0.8 + Math.min(volume / 10000, 0.2));

      return this.createSignal(
        symbol,
        'BUY',
        confidence,
        `Strong positive sentiment: Score ${score.toFixed(2)}, Volume ${volume}`,
        {
          entryPrice: price,
          targetPrice: price * 1.03, // Conservative 3% target
          stopLoss: price * 0.98,
          positionSize: 0.05, // Smaller position for sentiment trades
        }
      );
    }

    // Strong negative sentiment
    if (
      score < -0.6 && // Negative sentiment
      volume > 5000 // High mention volume
    ) {
      const confidence = Math.min(0.7, Math.abs(score) * 0.7);

      return this.createSignal(
        symbol,
        'SELL',
        confidence,
        `Strong negative sentiment: Score ${score.toFixed(2)}`,
        {
          entryPrice: price,
          targetPrice: price * 0.97,
          stopLoss: price * 1.02,
          positionSize: 0.05,
        }
      );
    }

    return null;
  }
}

// Combined Strategy (Uses multiple indicators)
export class CombinedStrategy extends BaseStrategy {
  name = 'Combined Multi-Factor';
  type: 'combined' = 'combined';

  private momentumStrategy: MomentumStrategy;
  private meanReversionStrategy: MeanReversionStrategy;
  private sentimentStrategy: SentimentStrategy;

  constructor(parameters: Record<string, any> = {}) {
    super(parameters);
    this.momentumStrategy = new MomentumStrategy();
    this.meanReversionStrategy = new MeanReversionStrategy();
    this.sentimentStrategy = new SentimentStrategy();
  }

  async analyze(data: MarketAnalysis): Promise<TradingSignal[]> {
    // Get signals from all strategies
    const [momentumSignals, meanReversionSignals, sentimentSignals] = await Promise.all([
      this.momentumStrategy.analyze(data),
      this.meanReversionStrategy.analyze(data),
      this.sentimentStrategy.analyze(data),
    ]);

    // Combine and weight signals
    const combinedSignals = this.combineSignals(
      momentumSignals,
      meanReversionSignals,
      sentimentSignals
    );

    return combinedSignals;
  }

  private combineSignals(
    momentum: TradingSignal[],
    meanReversion: TradingSignal[],
    sentiment: TradingSignal[]
  ): TradingSignal[] {
    const signalMap = new Map<string, TradingSignal[]>();

    // Group signals by symbol
    [...momentum, ...meanReversion, ...sentiment].forEach(signal => {
      const signals = signalMap.get(signal.symbol) || [];
      signals.push(signal);
      signalMap.set(signal.symbol, signals);
    });

    const combinedSignals: TradingSignal[] = [];

    // Analyze combined signals for each symbol
    signalMap.forEach((signals, symbol) => {
      if (signals.length >= 2) {
        // Multiple strategies agree
        const buySignals = signals.filter(s => s.action === 'BUY');
        const sellSignals = signals.filter(s => s.action === 'SELL');

        if (buySignals.length >= 2) {
          const avgConfidence = buySignals.reduce((sum, s) => sum + s.confidence, 0) / buySignals.length;
          const avgEntry = buySignals.reduce((sum, s) => sum + (s.entryPrice || 0), 0) / buySignals.length;
          const avgTarget = buySignals.reduce((sum, s) => sum + (s.targetPrice || 0), 0) / buySignals.length;
          const avgStopLoss = buySignals.reduce((sum, s) => sum + (s.stopLoss || 0), 0) / buySignals.length;

          combinedSignals.push(this.createSignal(
            symbol,
            'BUY',
            Math.min(0.95, avgConfidence * 1.2), // Boost confidence
            `Multiple strategies confirm BUY: ${buySignals.map(s => s.reason).join('; ')}`,
            {
              entryPrice: avgEntry,
              targetPrice: avgTarget,
              stopLoss: avgStopLoss,
              positionSize: 0.15, // Larger position for confirmed signals
            }
          ));
        } else if (sellSignals.length >= 2) {
          const avgConfidence = sellSignals.reduce((sum, s) => sum + s.confidence, 0) / sellSignals.length;

          combinedSignals.push(this.createSignal(
            symbol,
            'SELL',
            Math.min(0.95, avgConfidence * 1.2),
            `Multiple strategies confirm SELL: ${sellSignals.map(s => s.reason).join('; ')}`,
            {
              entryPrice: sellSignals[0].entryPrice,
              targetPrice: sellSignals[0].targetPrice,
              stopLoss: sellSignals[0].stopLoss,
              positionSize: 0.15,
            }
          ));
        }
      } else if (signals.length === 1) {
        // Single strategy signal - use with lower confidence
        const signal = signals[0];
        combinedSignals.push({
          ...signal,
          confidence: signal.confidence * 0.7, // Reduce confidence for single signals
          positionSize: (signal.positionSize || 0.1) * 0.5, // Smaller position
        });
      }
    });

    return combinedSignals;
  }
}

// Import DeFi Strategy
import { DeFiStrategy } from './DeFiStrategy.js';

// Strategy Manager
export class StrategyManager {
  private strategies: Map<string, TradingStrategy> = new Map();

  constructor() {
    // Initialize default strategies
    this.registerStrategy('momentum', new MomentumStrategy());
    this.registerStrategy('meanReversion', new MeanReversionStrategy());
    this.registerStrategy('sentiment', new SentimentStrategy());
    this.registerStrategy('combined', new CombinedStrategy());
    this.registerStrategy('defi', new DeFiStrategy());
  }

  registerStrategy(name: string, strategy: TradingStrategy): void {
    this.strategies.set(name, strategy);
    logger.info('Strategy registered', { name, type: strategy.type });
  }

  async analyzeWithStrategy(
    strategyName: string,
    data: MarketAnalysis
  ): Promise<TradingSignal[]> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    return strategy.analyze(data);
  }

  async analyzeWithAllStrategies(
    data: MarketAnalysis
  ): Promise<Map<string, TradingSignal[]>> {
    const results = new Map<string, TradingSignal[]>();

    for (const [name, strategy] of this.strategies) {
      try {
        const signals = await strategy.analyze(data);
        results.set(name, signals);
      } catch (error) {
        logger.error(`Error in strategy ${name}`, { error });
        results.set(name, []);
      }
    }

    return results;
  }

  getStrategy(name: string): TradingStrategy | undefined {
    return this.strategies.get(name);
  }

  listStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}