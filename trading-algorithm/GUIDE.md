# 📚 Kaiju Trading Algorithm Development Guide

## 🎯 Overview

This guide helps expert traders create trading algorithms that integrate with Kaiju No. 69. Your algorithm will become a living Kaiju NFT that others can follow by minting Shadow NFTs.

---

## 🏗️ Architecture Overview

```
Your Trading Algorithm → API Calls → Kaiju Service → Execute for Shadows → Update Performance
```

---

## 📋 Prerequisites

1. **Trading Knowledge**: Understanding of trading strategies and risk management
2. **Programming Skills**: JavaScript/TypeScript knowledge
3. **API Experience**: RESTful API integration
4. **Server Deployment**: Ability to host your algorithm (AWS, Heroku, etc.)

---

## 🚀 Quick Start

### 1. Clone the Template
```bash
git clone https://github.com/kaiju-no-69/trading-algorithm-template
cd trading-algorithm-template
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Kaiju Service Connection
KAIJU_SERVICE_URL=https://api.kaiju69.shape.network
KAIJU_ID=<your-kaiju-uuid>
ALGORITHM_KEY=<your-secret-key>

# Trading Configuration
MIN_CONFIDENCE_THRESHOLD=70
MAX_POSITION_SIZE=1000
TRADING_PAIRS=ETH/USDC,LINK/USDC

# Risk Management
STOP_LOSS_PERCENTAGE=5
TAKE_PROFIT_PERCENTAGE=10
MAX_DAILY_TRADES=20
```

### 3. Implement Your Strategy
```typescript
// src/strategies/MyStrategy.ts
import { TradingStrategy, MarketData, TradeSignal } from '../types';

export class MyTradingStrategy implements TradingStrategy {
  async analyze(marketData: MarketData): Promise<TradeSignal | null> {
    // Your trading logic here
    if (shouldBuy) {
      return {
        action: 'BUY',
        pair: 'ETH/USDC',
        confidence: 85,
        amount: '0.1',
        reason: 'Bullish breakout detected'
      };
    }
    return null;
  }
}
```

---

## 📡 API Integration

### Posting Trade Signals

```typescript
import { KaijuServiceClient } from './api/KaijuServiceClient';

const client = new KaijuServiceClient(
  process.env.KAIJU_SERVICE_URL,
  process.env.KAIJU_ID,
  process.env.ALGORITHM_KEY
);

// Post a swap trade
await client.postTrade({
  tradeType: 'swap',
  confidenceLevel: 85,
  reasoning: 'Moving average crossover detected',
  entryData: {
    type: 'swap',
    data: {
      tokenIn: '0x...USDC',
      tokenOut: '0x...WETH',
      amountIn: '1000000000', // 1000 USDC (6 decimals)
      minAmountOut: '400000000000000000' // 0.4 WETH (18 decimals)
    }
  }
});
```

### Trade Types Supported

#### 1. Token Swaps
```typescript
{
  tradeType: 'swap',
  entryData: {
    type: 'swap',
    data: {
      tokenIn: 'USDC_ADDRESS',
      tokenOut: 'WETH_ADDRESS',
      amountIn: 'AMOUNT_WITH_DECIMALS',
      minAmountOut: 'MIN_AMOUNT_WITH_DECIMALS'
    }
  }
}
```

#### 2. Liquidity Provision
```typescript
{
  tradeType: 'liquidity',
  entryData: {
    type: 'addLiquidity',
    data: {
      tokenA: 'TOKEN_A_ADDRESS',
      tokenB: 'TOKEN_B_ADDRESS',
      amountA: 'AMOUNT_A',
      amountB: 'AMOUNT_B'
    }
  }
}
```

#### 3. Perpetual Trading (Coming Soon)
```typescript
{
  tradeType: 'perpetual',
  entryData: {
    type: 'openPosition',
    data: {
      market: 'ETH-USD',
      side: 'LONG',
      size: '1.5',
      leverage: 10
    }
  }
}
```

---

## 🧠 Strategy Best Practices

### 1. Risk Management
```typescript
class RiskManager {
  canTrade(signal: TradeSignal): boolean {
    // Check daily trade limit
    if (this.todayTradeCount >= MAX_DAILY_TRADES) return false;
    
    // Check position size
    if (signal.amount > MAX_POSITION_SIZE) return false;
    
    // Check confidence threshold
    if (signal.confidence < MIN_CONFIDENCE) return false;
    
    return true;
  }
}
```

### 2. Market Data Sources
```typescript
// Recommended data providers
const providers = {
  chainlink: 'On-chain price feeds',
  coingecko: 'Historical data and metrics',
  dexscreener: 'DEX liquidity and volume',
  tradingview: 'Technical indicators'
};
```

### 3. Performance Tracking
```typescript
// Track your algorithm's performance
interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

// Update after each trade
await client.updatePerformance(metrics);
```

---

## 📊 Required Endpoints

Your algorithm must expose these health check endpoints:

```typescript
// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    uptime: process.uptime(),
    lastSignal: lastSignalTimestamp
  });
});

// GET /metrics
app.get('/metrics', (req, res) => {
  res.json({
    totalSignals: signalCount,
    successRate: winRate,
    activeStrategies: strategies.length
  });
});
```

---

## 🔒 Security Requirements

### 1. API Key Protection
- Never expose your `ALGORITHM_KEY` in code
- Use environment variables
- Rotate keys regularly

### 2. Trade Validation
```typescript
// Always validate trades before posting
function validateTrade(trade: TradeSignal): boolean {
  // Check amounts are positive
  if (parseFloat(trade.amount) <= 0) return false;
  
  // Check addresses are valid
  if (!isValidAddress(trade.tokenIn)) return false;
  
  // Check slippage is reasonable
  if (trade.slippage > 5) return false;
  
  return true;
}
```

### 3. Rate Limiting
```typescript
// Implement rate limiting
const rateLimiter = {
  maxTradesPerHour: 30,
  maxTradesPerDay: 100,
  cooldownPeriod: 60 // seconds
};
```

---

## 🚦 Testing Your Algorithm

### 1. Local Testing
```bash
# Run in test mode
npm run test

# Simulate market conditions
npm run simulate -- --scenario bull-market

# Backtest with historical data
npm run backtest -- --from 2024-01-01 --to 2024-12-31
```

### 2. Testnet Deployment
```bash
# Deploy to Shape Testnet first
npm run deploy:testnet

# Monitor performance
npm run monitor
```

### 3. Performance Benchmarks
Your algorithm should meet these minimum requirements:
- **Response Time**: < 1 second per signal
- **Uptime**: > 99%
- **Win Rate**: > 55%
- **Max Drawdown**: < 20%

---

## 📝 Submission Checklist

Before going live, ensure:

- [ ] Algorithm passes all tests
- [ ] Risk management implemented
- [ ] API endpoints working
- [ ] Documentation complete
- [ ] Deployed to reliable hosting
- [ ] Testnet results positive
- [ ] Security audit passed

---

## 🎯 Example Strategies

### 1. Moving Average Crossover
```typescript
export class MACrossoverStrategy {
  async analyze(data: MarketData): Promise<TradeSignal> {
    const ma20 = calculateMA(data.prices, 20);
    const ma50 = calculateMA(data.prices, 50);
    
    if (ma20 > ma50 && previousMA20 <= previousMA50) {
      return { action: 'BUY', confidence: 75 };
    }
  }
}
```

### 2. RSI Divergence
```typescript
export class RSIDivergenceStrategy {
  async analyze(data: MarketData): Promise<TradeSignal> {
    const rsi = calculateRSI(data.prices, 14);
    
    if (rsi < 30 && isPriceDiverging(data)) {
      return { action: 'BUY', confidence: 80 };
    }
  }
}
```

### 3. Volume Profile Analysis
```typescript
export class VolumeProfileStrategy {
  async analyze(data: MarketData): Promise<TradeSignal> {
    const vpoc = findVolumePointOfControl(data);
    
    if (price < vpoc && volume > avgVolume * 2) {
      return { action: 'BUY', confidence: 85 };
    }
  }
}
```

---

## 🆘 Support & Resources

### Documentation
- API Reference: [docs.kaiju69.shape.network/api](https://docs.kaiju69.shape.network/api)
- Video Tutorials: [youtube.com/kaiju69](https://youtube.com/kaiju69)
- Discord Community: [discord.gg/kaiju69](https://discord.gg/kaiju69)

### Common Issues
1. **Rate Limiting**: Implement exponential backoff
2. **Network Errors**: Add retry logic with circuit breakers
3. **Slippage**: Use dynamic slippage based on liquidity

---

## 🎉 Ready to Deploy?

1. **Test thoroughly** on testnet
2. **Register your Kaiju** at app.kaiju69.shape.network
3. **Mint your Kaiju NFT** (free!)
4. **Set your fees** and commission rates
5. **Go live** and start earning!

---

*Happy Trading! May your Kaiju bring prosperity to all its Shadows!* 🐉