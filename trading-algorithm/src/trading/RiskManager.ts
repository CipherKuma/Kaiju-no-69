import { Position, Trade, TradingSignal, RiskMetrics } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class RiskManager {
  private positions: Map<string, Position> = new Map();
  private trades: Trade[] = [];
  private portfolioValue: number;
  private dailyPnL: number = 0;
  private dailyStartValue: number;

  constructor(initialCapital: number) {
    this.portfolioValue = initialCapital;
    this.dailyStartValue = initialCapital;
  }

  // Position sizing methods
  calculatePositionSize(
    signal: TradingSignal,
    currentPrice: number,
    volatility?: number
  ): number {
    const method = config.riskManagement.positionSizingMethod;
    const maxPositionSize = config.trading.maxPositionSize;

    let positionSize = 0;

    switch (method) {
      case 'fixed':
        positionSize = this.fixedPositionSizing();
        break;
      case 'kelly':
        positionSize = this.kellyPositionSizing(signal.confidence);
        break;
      case 'volatility':
        positionSize = this.volatilityBasedSizing(volatility || 0.02);
        break;
      default:
        positionSize = this.fixedPositionSizing();
    }

    // Apply maximum position size limit
    positionSize = Math.min(positionSize, maxPositionSize);

    // Check if we have enough capital
    const requiredCapital = currentPrice * positionSize * this.portfolioValue;
    if (requiredCapital > this.getAvailableCapital()) {
      positionSize = this.getAvailableCapital() / (currentPrice * this.portfolioValue);
    }

    return positionSize;
  }

  private fixedPositionSizing(): number {
    return config.trading.maxPositionSize;
  }

  private kellyPositionSizing(winProbability: number): number {
    // Kelly Criterion: f = (p * b - q) / b
    // where f = fraction to bet, p = win probability, q = loss probability, b = odds
    const p = winProbability;
    const q = 1 - p;
    const b = config.trading.takeProfitPercentage / config.trading.stopLossPercentage;
    
    const kelly = (p * b - q) / b;
    
    // Use fractional Kelly (25%) for safety
    return Math.max(0, Math.min(kelly * 0.25, config.trading.maxPositionSize));
  }

  private volatilityBasedSizing(volatility: number): number {
    // Lower position size for higher volatility
    const targetRisk = 0.02; // 2% portfolio risk per trade
    const stopLoss = config.trading.stopLossPercentage;
    
    const positionSize = targetRisk / (volatility * stopLoss);
    return Math.min(positionSize, config.trading.maxPositionSize);
  }

  // Risk validation
  async validateTrade(signal: TradingSignal): Promise<{
    isValid: boolean;
    reason?: string;
    adjustedSignal?: TradingSignal;
  }> {
    // Check daily loss limit
    if (this.isDailyLossLimitReached()) {
      return {
        isValid: false,
        reason: 'Daily loss limit reached',
      };
    }

    // Check maximum open positions
    if (this.positions.size >= config.riskManagement.maxOpenPositions) {
      return {
        isValid: false,
        reason: 'Maximum open positions reached',
      };
    }

    // Check correlation risk
    const correlationRisk = this.checkCorrelationRisk(signal.symbol);
    if (correlationRisk > 0.8) {
      return {
        isValid: false,
        reason: 'High correlation with existing positions',
      };
    }

    // Adjust position size based on risk
    const adjustedSize = this.calculatePositionSize(
      signal,
      signal.entryPrice || 0
    );

    const adjustedSignal = {
      ...signal,
      positionSize: adjustedSize,
    };

    return {
      isValid: true,
      adjustedSignal,
    };
  }

  // Position management
  addPosition(position: Position): void {
    this.positions.set(position.id, position);
    logger.info('Position added', { position });
  }

  updatePosition(positionId: string, currentPrice: number): void {
    const position = this.positions.get(positionId);
    if (!position) return;

    position.currentPrice = currentPrice;
    const priceDiff = position.side === 'LONG' 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    
    position.pnl = priceDiff * position.quantity;
    position.pnlPercentage = (priceDiff / position.entryPrice) * 100;

    // Check stop loss
    if (position.stopLoss) {
      if (
        (position.side === 'LONG' && currentPrice <= position.stopLoss) ||
        (position.side === 'SHORT' && currentPrice >= position.stopLoss)
      ) {
        logger.warn('Stop loss triggered', { position });
        this.closePosition(positionId, currentPrice, 'Stop loss hit');
      }
    }

    // Check take profit
    if (position.takeProfit) {
      if (
        (position.side === 'LONG' && currentPrice >= position.takeProfit) ||
        (position.side === 'SHORT' && currentPrice <= position.takeProfit)
      ) {
        logger.info('Take profit triggered', { position });
        this.closePosition(positionId, currentPrice, 'Take profit hit');
      }
    }
  }

  closePosition(positionId: string, exitPrice: number, reason: string): Trade | null {
    const position = this.positions.get(positionId);
    if (!position) return null;

    const priceDiff = position.side === 'LONG'
      ? exitPrice - position.entryPrice
      : position.entryPrice - exitPrice;
    
    const pnl = priceDiff * position.quantity;

    const trade: Trade = {
      id: positionId + '-close',
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      price: exitPrice,
      quantity: position.quantity,
      timestamp: new Date(),
      fee: exitPrice * position.quantity * 0.001,
      pnl,
      reason,
    };

    this.trades.push(trade);
    this.positions.delete(positionId);
    this.dailyPnL += pnl;
    this.portfolioValue += pnl;

    logger.info('Position closed', { position, trade });
    return trade;
  }

  // Risk metrics calculation
  calculateRiskMetrics(): RiskMetrics {
    const closedTrades = this.trades.filter(t => t.pnl !== undefined);
    const winningTrades = closedTrades.filter(t => t.pnl! > 0);
    const losingTrades = closedTrades.filter(t => t.pnl! < 0);

    const winRate = closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0;

    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length
      : 0;

    const averageLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length)
      : 0;

    const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown();

    // Calculate Sharpe ratio (simplified)
    const sharpeRatio = this.calculateSharpeRatio();

    return {
      portfolioValue: this.portfolioValue,
      dailyPnL: this.dailyPnL,
      dailyPnLPercentage: (this.dailyPnL / this.dailyStartValue) * 100,
      openPositions: this.positions.size,
      maxDrawdown,
      sharpeRatio,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio,
    };
  }

  private calculateMaxDrawdown(): number {
    if (this.trades.length === 0) return 0;

    let peak = this.dailyStartValue;
    let maxDrawdown = 0;
    let currentValue = this.dailyStartValue;

    for (const trade of this.trades) {
      if (trade.pnl) {
        currentValue += trade.pnl;
        if (currentValue > peak) {
          peak = currentValue;
        }
        const drawdown = (peak - currentValue) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown * 100;
  }

  private calculateSharpeRatio(): number {
    if (this.trades.length < 2) return 0;

    const returns = this.trades
      .filter(t => t.pnl !== undefined)
      .map(t => t.pnl! / this.portfolioValue);

    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualized Sharpe ratio (assuming daily returns)
    const annualizedReturn = avgReturn * 252;
    const annualizedStdDev = stdDev * Math.sqrt(252);

    return stdDev > 0 ? annualizedReturn / annualizedStdDev : 0;
  }

  // Helper methods
  private isDailyLossLimitReached(): boolean {
    const dailyLossPercentage = Math.abs(this.dailyPnL / this.dailyStartValue);
    return dailyLossPercentage >= config.riskManagement.maxDailyLoss;
  }

  private checkCorrelationRisk(symbol: string): number {
    // Simplified correlation check
    // In production, calculate actual correlation between assets
    let correlatedPositions = 0;
    
    for (const [, position] of this.positions) {
      // Assume high correlation for same base asset
      const baseAsset1 = symbol.split('/')[0];
      const baseAsset2 = position.symbol.split('/')[0];
      
      if (baseAsset1 === baseAsset2) {
        correlatedPositions++;
      }
    }

    return correlatedPositions / Math.max(this.positions.size, 1);
  }

  private getAvailableCapital(): number {
    let usedCapital = 0;
    
    for (const [, position] of this.positions) {
      usedCapital += position.entryPrice * position.quantity;
    }

    return this.portfolioValue - usedCapital;
  }

  // Daily reset
  resetDaily(): void {
    this.dailyPnL = 0;
    this.dailyStartValue = this.portfolioValue;
    logger.info('Daily risk metrics reset', { portfolioValue: this.portfolioValue });
  }

  // Getters
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getPortfolioValue(): number {
    return this.portfolioValue;
  }
}