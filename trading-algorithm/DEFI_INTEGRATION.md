# DeFi Trading Algorithm Integration

## Overview

The trading algorithm has been successfully integrated with real DeFi operations on Shape Sepolia. The system now performs actual on-chain transactions based on market analysis instead of just simulations.

## What's Been Implemented

### 1. DeFi Executor Module (`src/defi/DeFiExecutor.ts`)
- Connects to Shape Sepolia blockchain
- Manages wallet and contract interactions
- Executes spot trades via Uniswap V2
- Supports perpetual trading (if perps contracts are deployed)
- Handles token approvals and gas management

### 2. DeFi Trading Strategy (`src/strategies/DeFiStrategy.ts`)
- Analyzes market conditions for DeFi opportunities
- Generates signals for spot trades and perpetual positions
- Considers volatility, trends, and sentiment
- Optimized position sizing for DeFi operations

### 3. Enhanced Trading Engine
- Integrated real DeFi execution for live trading mode
- Falls back to simulation in paper trading mode
- Tracks on-chain transactions and positions
- Emits events for executed trades

## Current Wallet Status

The configured wallet (0x6B9ad963c764a06A7ef8ff96D38D0cB86575eC00) has:
- **ETH**: 0.0958 ETH (for gas)
- **USDC**: 1,002,797 USDC
- **USDT**: 1,013,000 USDT
- **DAI**: 1,011,000 DAI
- **LINK**: 110,100 LINK
- **SHAPE**: 1,010,000 SHAPE
- **Perps Collateral**: 10,000 USDC

## Available Operations

### 1. Spot Trading
- ETH/USDC swaps
- ETH/USDT swaps
- Token-to-token swaps via WETH routing
- Automatic slippage protection (5%)

### 2. Perpetual Trading (if deployed)
- Long/short positions on BTC, ETH, SOL
- Leverage up to 10x
- Automatic position sizing based on available collateral

### 3. Liquidity Provision
- Add liquidity to Uniswap V2 pools
- Remove liquidity positions

## How to Use

### 1. Set Trading Mode to Live
Edit `.env` file:
```
TRADING_MODE=live
```

### 2. Start the Trading Algorithm
```bash
npm run build
npm start
```

### 3. Monitor Trading Activity
The system will:
- Analyze markets every 5 minutes
- Execute trades when signals meet confidence thresholds
- Log all transactions with tx hashes
- Update portfolio tracking in real-time

## Trading Strategies

The system uses multiple strategies:
- **Momentum Trading**: Follows strong trends
- **Mean Reversion**: Trades oversold/overbought conditions
- **DeFi Strategy**: Optimized for on-chain operations
- **Sentiment Analysis**: Reacts to market sentiment extremes

## Safety Features

- Position size limits (max 10-20% per trade)
- Stop loss on all positions
- Risk management validation before execution
- Gas price monitoring
- Slippage protection

## Testing

Run the DeFi executor test:
```bash
npm run build
node dist/test-defi.js
```

## Important Notes

- Only Shape Sepolia is fully supported
- Keep sufficient ETH for gas fees
- Monitor the trading algorithm logs for execution details
- All trades are real and use actual funds