export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  change24h: number;
}

export interface TradingSignal {
  id?: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  confidence: number; // 0-1
  reason: string;
  timestamp: Date;
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  positionSize?: number;
  leverage?: number; // For perpetual trades
  strategy?: string; // Strategy name that generated the signal
  tradeType?: 'spot' | 'perpetual' | 'liquidity';
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercentage: number;
  openedAt: Date;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: Date;
  fee: number;
  pnl?: number;
  reason: string;
}

export interface SentimentData {
  symbol: string;
  score: number; // -1 to 1
  sources: {
    twitter: number;
    reddit: number;
    news: number;
  };
  volume: number; // mention volume
  timestamp: Date;
}

export interface TechnicalIndicators {
  symbol: string;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  bbands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volume: number;
  atr: number;
  timestamp: Date;
}

export interface RiskMetrics {
  portfolioValue: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  openPositions: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
}

export interface TradingStrategy {
  name: string;
  type: 'momentum' | 'meanReversion' | 'arbitrage' | 'sentiment' | 'combined' | 'defi';
  parameters: Record<string, any>;
  analyze(data: MarketAnalysis): Promise<TradingSignal[]>;
}

export interface MarketAnalysis {
  marketData: MarketData[];
  technicalIndicators: TechnicalIndicators;
  sentimentData: SentimentData;
  newsData?: NewsItem[];
}

export interface NewsItem {
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  source: string;
  sentiment: number;
  relevantSymbols: string[];
}

export interface TradingAbility {
  type: 'spot' | 'perpetual' | 'lending' | 'borrowing' | 'staking';
  execute(params: any): Promise<any>;
}

export interface AIDecision {
  signals: TradingSignal[];
  reasoning: string;
  marketCondition: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  confidence: number;
  suggestedActions: {
    symbol: string;
    action: string;
    rationale: string;
  }[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}