import * as ccxt from 'ccxt';
import { EventEmitter } from 'events';
import { MarketData } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class MarketDataCollector extends EventEmitter {
  private exchange: ccxt.Exchange;
  private symbols: string[];
  private intervalId?: NodeJS.Timeout;
  private marketDataCache: Map<string, MarketData> = new Map();

  constructor(symbols: string[]) {
    super();
    this.symbols = symbols;
    
    // Initialize exchange
    const ExchangeClass = ccxt[config.exchange.name as keyof typeof ccxt] as typeof ccxt.Exchange;
    
    // Only use API credentials in live trading mode
    const exchangeConfig: any = {
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
      },
    };
    
    // Add credentials only if in live mode and credentials are provided
    if (config.trading.mode === 'live' && config.exchange.apiKey && config.exchange.apiSecret) {
      exchangeConfig.apiKey = config.exchange.apiKey;
      exchangeConfig.secret = config.exchange.apiSecret;
    }
    
    this.exchange = new ExchangeClass(exchangeConfig);
  }

  async start(): Promise<void> {
    logger.info('Starting market data collector', { symbols: this.symbols });
    
    // Load markets
    await this.exchange.loadMarkets();
    
    // Initial fetch
    await this.fetchMarketData();
    
    // Set up interval
    this.intervalId = setInterval(
      () => this.fetchMarketData(),
      config.dataCollection.priceUpdateInterval
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logger.info('Stopped market data collector');
  }

  private async fetchMarketData(): Promise<void> {
    try {
      const tickers = await this.exchange.fetchTickers(this.symbols);
      
      for (const symbol of this.symbols) {
        const ticker = tickers[symbol];
        if (!ticker) continue;

        const marketData: MarketData = {
          symbol,
          price: ticker.last || 0,
          volume: ticker.quoteVolume || 0,
          timestamp: new Date(),
          bid: ticker.bid || 0,
          ask: ticker.ask || 0,
          high24h: ticker.high || 0,
          low24h: ticker.low || 0,
          change24h: ticker.percentage || 0,
        };

        this.marketDataCache.set(symbol, marketData);
        this.emit('marketData', marketData);
      }
    } catch (error) {
      logger.error('Error fetching market data', { error: error instanceof Error ? error.message : error });
    }
  }

  getLatestData(symbol: string): MarketData | undefined {
    return this.marketDataCache.get(symbol);
  }

  getAllLatestData(): Map<string, MarketData> {
    return new Map(this.marketDataCache);
  }

  async fetchOrderBook(symbol: string, limit: number = 10): Promise<ccxt.OrderBook> {
    try {
      return await this.exchange.fetchOrderBook(symbol, limit);
    } catch (error) {
      logger.error('Error fetching order book', { symbol, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async fetchOHLCV(symbol: string, timeframe: string = '5m', limit: number = 100): Promise<ccxt.OHLCV[]> {
    try {
      return await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    } catch (error) {
      logger.error('Error fetching OHLCV data', { symbol, timeframe, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}