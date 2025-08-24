import * as TI from 'technicalindicators';
import { EventEmitter } from 'events';
import { TechnicalIndicators } from '../types/index.js';
import { MarketDataCollector } from '../collectors/MarketDataCollector.js';
import { logger } from '../utils/logger.js';

export class TechnicalAnalyzer extends EventEmitter {
  private marketDataCollector: MarketDataCollector;
  private symbols: string[];
  private indicatorCache: Map<string, TechnicalIndicators> = new Map();

  constructor(marketDataCollector: MarketDataCollector, symbols: string[]) {
    super();
    this.marketDataCollector = marketDataCollector;
    this.symbols = symbols;
  }

  async calculateIndicators(symbol: string): Promise<TechnicalIndicators> {
    try {
      // Fetch OHLCV data
      const ohlcv = await this.marketDataCollector.fetchOHLCV(symbol, '15m', 100);
      
      if (ohlcv.length < 50) {
        throw new Error('Insufficient data for technical analysis');
      }

      const closes = ohlcv.map(candle => candle[4]); // Close prices
      const highs = ohlcv.map(candle => candle[2]); // High prices
      const lows = ohlcv.map(candle => candle[3]); // Low prices
      const volumes = ohlcv.map(candle => candle[5]); // Volumes

      // Calculate RSI
      // @ts-ignore
      const rsiResult: any = TI.RSI.calculate({
        values: closes,
        period: 14,
      });
      const filteredRSI = (rsiResult as any[]).filter((v: any): v is number => v !== undefined && v !== null);
      const currentRSI = filteredRSI[filteredRSI.length - 1] || 50;

      // Calculate MACD
      // @ts-ignore
      const macdResult: any = TI.MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      const currentMACD = macdResult[macdResult.length - 1] || {
        MACD: 0,
        signal: 0,
        histogram: 0,
      };

      // Calculate SMA
      // @ts-ignore
      const sma20Result: any = TI.SMA.calculate({
        values: closes,
        period: 20,
      });
      const filteredSMA20 = (sma20Result as any[]).filter((v: any): v is number => v !== undefined && v !== null);
      // @ts-ignore
      const sma50Result: any = TI.SMA.calculate({
        values: closes,
        period: 50,
      });
      const filteredSMA50 = (sma50Result as any[]).filter((v: any): v is number => v !== undefined && v !== null);

      // Calculate EMA
      // @ts-ignore
      const ema12Result: any = TI.EMA.calculate({
        values: closes,
        period: 12,
      });
      const filteredEMA12 = (ema12Result as any[]).filter((v: any): v is number => v !== undefined && v !== null);
      // @ts-ignore
      const ema26Result: any = TI.EMA.calculate({
        values: closes,
        period: 26,
      });
      const filteredEMA26 = (ema26Result as any[]).filter((v: any): v is number => v !== undefined && v !== null);

      // Calculate Bollinger Bands
      // @ts-ignore
      const bbandsResult: any = TI.BollingerBands.calculate({
        period: 20,
        values: closes,
        stdDev: 2,
      });
      const currentBBands = bbandsResult[bbandsResult.length - 1] || {
        upper: closes[closes.length - 1],
        middle: closes[closes.length - 1],
        lower: closes[closes.length - 1],
      };

      // Calculate ATR (Average True Range)
      // @ts-ignore
      const atrResult: any = TI.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14,
      });
      const filteredATR = (atrResult as any[]).filter((v: any): v is number => v !== undefined && v !== null);
      const currentATR = filteredATR[filteredATR.length - 1] || 0;

      const indicators: TechnicalIndicators = {
        symbol,
        // @ts-ignore
        rsi: currentRSI,
        macd: {
          value: currentMACD.MACD || 0,
          signal: currentMACD.signal || 0,
          histogram: currentMACD.histogram || 0,
        },
        // @ts-ignore
        sma20: filteredSMA20[filteredSMA20.length - 1] || closes[closes.length - 1],
        // @ts-ignore
        sma50: filteredSMA50[filteredSMA50.length - 1] || closes[closes.length - 1],
        // @ts-ignore
        ema12: filteredEMA12[filteredEMA12.length - 1] || closes[closes.length - 1],
        // @ts-ignore
        ema26: filteredEMA26[filteredEMA26.length - 1] || closes[closes.length - 1],
        bbands: {
          upper: currentBBands.upper || closes[closes.length - 1],
          middle: currentBBands.middle || closes[closes.length - 1],
          lower: currentBBands.lower || closes[closes.length - 1],
        },
        volume: volumes[volumes.length - 1],
        // @ts-ignore
        atr: currentATR,
        timestamp: new Date(),
      };

      this.indicatorCache.set(symbol, indicators);
      this.emit('technicalIndicators', indicators);

      return indicators;
    } catch (error) {
      logger.error('Error calculating technical indicators', {
        symbol,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async analyzeAllSymbols(): Promise<Map<string, TechnicalIndicators>> {
    const results = new Map<string, TechnicalIndicators>();

    for (const symbol of this.symbols) {
      try {
        const indicators = await this.calculateIndicators(symbol);
        results.set(symbol, indicators);
      } catch (error) {
        logger.error('Failed to analyze symbol', { symbol, error });
      }
    }

    return results;
  }

  getLatestIndicators(symbol: string): TechnicalIndicators | undefined {
    return this.indicatorCache.get(symbol);
  }

  // Advanced analysis methods
  detectDivergence(symbol: string, priceData: number[], indicatorData: number[]): {
    type: 'bullish' | 'bearish' | 'none';
    strength: number;
  } {
    if (priceData.length < 4 || indicatorData.length < 4) {
      return { type: 'none', strength: 0 };
    }

    const priceTrend = this.calculateTrend(priceData.slice(-4));
    const indicatorTrend = this.calculateTrend(indicatorData.slice(-4));

    if (priceTrend < 0 && indicatorTrend > 0) {
      return { type: 'bullish', strength: Math.abs(priceTrend - indicatorTrend) };
    } else if (priceTrend > 0 && indicatorTrend < 0) {
      return { type: 'bearish', strength: Math.abs(priceTrend - indicatorTrend) };
    }

    return { type: 'none', strength: 0 };
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  identifyPattern(symbol: string, candleData: any[]): {
    pattern: string;
    bullish: boolean;
    reliability: number;
  } | null {
    // Simplified pattern recognition
    // In production, you would use more sophisticated pattern recognition
    
    if (candleData.length < 3) return null;

    const lastCandle = candleData[candleData.length - 1];
    const prevCandle = candleData[candleData.length - 2];

    // Hammer pattern
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const lowerWick = lastCandle.low - Math.min(lastCandle.open, lastCandle.close);
    const upperWick = Math.max(lastCandle.open, lastCandle.close) - lastCandle.high;

    if (lowerWick > body * 2 && upperWick < body * 0.5) {
      return {
        pattern: 'hammer',
        bullish: true,
        reliability: 0.7,
      };
    }

    // Doji pattern
    if (body < (lastCandle.high - lastCandle.low) * 0.1) {
      return {
        pattern: 'doji',
        bullish: false, // Neutral pattern
        reliability: 0.6,
      };
    }

    return null;
  }
}